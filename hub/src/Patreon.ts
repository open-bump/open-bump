import FormData from "form-data";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { Op } from "sequelize";
import config from "./config";
import Hub from "./Hub";
import Donator from "./models/Donator";
import User from "./models/User";

interface IData {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string;
}

interface IMember {
  attributes: {
    currently_entitled_amount_cents: number;
    email: string;
    full_name: string;
    patron_status: string;
  };
  id: string;
  relationships: {
    currently_entitled_tiers: {
      data: Array<any>;
    };
    user: {
      data: IUser;
      links: {
        related: string;
      };
    };
  };
  type: "member";
  user?: IUser;
}

interface IUser {
  attributes: {
    full_name: string;
    social_connections?: {
      discord?: {
        url: null;
        user_id: string;
      };
    };
  };
  id: string;
  type: "user";
}

interface ICampaign {
  attributes: {};
  id: string;
  type: "campaign";
}

interface ICampaignResponse {
  data: ICampaign;
  links: {
    self: string;
  };
  members?: { [id: string]: IMember | undefined };
}

interface IMembersResponse {
  data: Array<IMember>;
  included: Array<IUser>;
  links: {
    next: string;
  };
  meta: {
    pagination: {
      cursors: object;
      total: number;
    };
  };
}

export default class Patreon {
  private cache!: {
    campaign: ICampaignResponse;
    discordUserMembers: { [id: string]: { [id: string]: IMember } };
  };
  private data!: IData;

  constructor(private instance: Hub) {
    if (!config.patreon.enabled) {
      console.log(`Patreon is disabled by config.`);
      return this;
    }
    this.loadData();
  }

  public async init() {
    if (!config.patreon.enabled) return;
    await this.prepare();
    await this.patreonRefreshLoop();
  }

  private async prepare() {
    console.log("Starting patreon services...");
    await this.fetchAccessToken();

    const campaign = await this.getCampaign();
    this.cache = { campaign, discordUserMembers: {} };
  }

  private async patreonRefreshLoop() {
    await this.refreshMembers();
    await this.updatePatreonsDatabase();
    setTimeout(this.patreonRefreshLoop.bind(this), 1000 * 60);
  }

  private async updatePatreonsDatabase() {
    const patreonUserDatabases = await User.scope("default").findAll({
      where: {
        id: {
          [Op.in]: Object.keys(this.cache.discordUserMembers)
        }
      }
    });
    const donatorIds: Array<string> = [];

    for (const id of Object.keys(this.cache.discordUserMembers)) {
      let userDatabase: User | undefined = patreonUserDatabases.find(
        (user) => user.id === id
      );
      if (!userDatabase) userDatabase = await User.create({ id });
      const members = this.cache.discordUserMembers[id];
      const totalEntitledCents = Object.values(members)
        .map(
          (member) => member?.attributes?.currently_entitled_amount_cents || 0
        )
        .reduce((current, accumulator) => current + accumulator, 0);
      if (totalEntitledCents) donatorIds.push(id);
      if (!userDatabase.donator)
        userDatabase.donator = await userDatabase.$create<Donator>(
          "donator",
          {}
        );
      if (!userDatabase.donator) {
        console.error(
          "Unexpected flow, this error should never happen. [273872]"
        );
        continue;
      }
      userDatabase.donator.patreon = totalEntitledCents;
      if (userDatabase.donator.changed()) await userDatabase.donator.save();
    }

    const allPatreonUserDatabases = await User.findAll({
      include: [
        {
          model: Donator,
          where: {
            patreon: {
              [Op.gt]: 0
            }
          },
          required: true
        }
      ]
    });
    console.log(
      `Currently, there are ${allPatreonUserDatabases.length} patreon donators in the database.`
    );

    const formerPatreonUserDatabases = allPatreonUserDatabases.filter(
      (user) => !donatorIds.includes(user.id)
    );
    for (const user of formerPatreonUserDatabases) {
      if (!user.donator) await user.$create("donator", {});
      if (!user.donator) {
        console.error(
          "Unexpected flow, this error should never happen. [283948]"
        );
        continue;
      }
      user.donator.patreon = 0;
      await user.donator.save();
      console.log(
        `User ${user.id} is not a patreon. Resetted patreon balance to 0.`
      );
    }
  }

  private async refreshMembers() {
    try {
      const members = await this.getCampaignMembers();
      let ids = this.cache.campaign.members
        ? Object.keys(this.cache.campaign.members)
        : [];
      if (members) {
        const users = [];
        for (const user of members.included) {
          if (user) users[user.id] = user;
        }
        for (const member of members.data) {
          const userId = member.relationships.user.data.id;
          const user = users[userId];
          if (user) member.user = user;
          if (!this.cache.campaign.members) this.cache.campaign.members = {};
          this.cache.campaign.members[member.id] = member;
          ids = ids.filter((id) => id !== member.id);
        }
      }
      for (const id of ids)
        if (this.cache.campaign.members)
          this.cache.campaign.members[id] = undefined;
    } catch (error) {
      console.error(`Catched error while refreshing Patreon!`, error);
    }

    if (this.cache.campaign.members) {
      for (const member of Object.values(this.cache.campaign.members)) {
        if (member?.user?.attributes?.social_connections?.discord?.user_id) {
          const discordId =
            member.user.attributes.social_connections.discord.user_id;
          const discordUserMemberObject: { [id: string]: IMember } =
            this.cache.discordUserMembers[discordId] || {};
          discordUserMemberObject[member.id] = member;
          this.cache.discordUserMembers[discordId] = discordUserMemberObject;
        }
      }
    } else console.warn("Patreon campaign members are undefined.");
  }

  private async fetchAccessToken() {
    // POST www.patreon.com/api/oauth2/token
    //   ?grant_type=refresh_token
    //   &refresh_token=<the user‘s refresh_token>
    //   &client_id=<your client id>
    //   &client_secret=<your client secret>
    const form = new FormData();
    form.append("grant_type", "refresh_token");
    form.append("client_id", this.data.clientId);
    form.append("client_secret", this.data.clientSecret);
    form.append("refresh_token", this.data.refreshToken);

    const res = await fetch("https://www.patreon.com/api/oauth2/token", {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    }).then((res) => res.json());

    if (!res.refresh_token) throw new Error(JSON.stringify(res, undefined, 2));

    this.data.refreshToken = res.refresh_token;
    this.data.accessToken = res.access_token;

    this.saveData();

    console.log(`Refresh Token: ${this.data.refreshToken.substr(0, 10)}`);
    console.log(`Access Token: ${this.data.accessToken.substr(0, 10)}`);

    setTimeout(this.fetchAccessToken.bind(this), 1000 * 60 * 60 * 12); // Refresh it every 12 hours to make sure it stays fresh
  }

  private async getCampaign() {
    const res = await fetch(
      `https://www.patreon.com/api/oauth2/v2/campaigns/${config.patreon.campaign}`,
      {
        headers: {
          Authorization: `Bearer ${this.data.accessToken}`
        }
      }
    ).then((res) => res.json());
    return res;
  }

  private async getCampaignMembers() {
    const data: any = [];
    const included: any = [];
    let next: boolean | string = true;
    while (next) {
      const res: IMembersResponse = await fetch(
        typeof next === "string"
          ? next
          : `https://www.patreon.com/api/oauth2/v2/campaigns/${config.patreon.campaign}/members?fields%5Bmember%5D=full_name,email,patron_status,currently_entitled_amount_cents&include=user,currently_entitled_tiers&fields%5Buser%5D=full_name,social_connections`,
        {
          headers: {
            Authorization: `Bearer ${this.data.accessToken}`
          }
        }
      ).then((res) => res.json());
      if (res.data) res.data.forEach((v) => data.push(v));
      if (res.included) res.included.forEach((v: any) => included.push(v));
      if (res.links && res.links.next) next = res.links.next;
      else next = false;
    }
    return { data, included };
  }

  private loadData() {
    const content = fs
      .readFileSync(path.join(this.instance.directory, config.patreon.file))
      .toString("utf8");
    this.data = JSON.parse(content);
  }

  private saveData() {
    const content = JSON.stringify(this.data, undefined, 2);
    fs.writeFileSync(
      path.join(this.instance.directory, config.patreon.file),
      content
    );
  }
}
