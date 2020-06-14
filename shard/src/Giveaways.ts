import Discord, { MessageEmbedOptions, MessageReaction } from "discord.js";
import ms from "ms";
import fetch from "node-fetch";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import Giveaway from "./models/Giveaway";
import GiveawayRequirement from "./models/GiveawayRequirement";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";
import Utils, { TextBasedGuildChannel, TitleError } from "./Utils";

export interface RequirementData {
  type: "GUILD" | "ROLE" | "VOTE";
  target?: string;
  invite?: string;
}

interface APIMember {
  user: {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
    public_flags: number;
  };
  roles: Array<string>;
  nick: null | string;
  premium_since: null | string;
  mute: boolean;
  deaf: boolean;
  joined_at: string;
}

export default class Giveaways {
  public static async start(
    guild: Discord.Guild,
    channel: TextBasedGuildChannel,
    prize: string,
    time: number,
    winnersCount: number,
    requirements: Array<RequirementData> = [],
    author: string
  ): Promise<Giveaway> {
    const message = await channel.send(`Loading giveaway...`);

    const giveaway = await Giveaway.create({
      id: message.id,
      guildId: guild.id,
      channel: channel.id,
      prize,
      time,
      winnersCount,
      createdBy: author
    });

    if (!giveaway.requirements) giveaway.requirements = [];
    for (const requirement of requirements) {
      giveaway.requirements.push(
        await GiveawayRequirement.create({
          giveawayId: giveaway.id,
          type: requirement.type,
          target: requirement.target,
          invite: requirement.invite
        })
      );
    }

    const embed = await this.giveawayToEmbed(giveaway);

    await message.edit("", { embed });
    await message.react(Utils.Emojis.getRaw(Utils.Emojis.TADA));

    return giveaway;
  }

  public static async enter(
    user: Discord.User | Discord.PartialUser,
    giveaway: Giveaway,
    reaction?: MessageReaction
  ) {
    if (user.partial)
      user = await OpenBump.instance.client.users.fetch(user.id);
    const guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
    if (!guild) throw new Error("Guild not found!");
    let requirements: Array<[GiveawayRequirement, boolean]> = [];
    const cache: Array<{ guild: string; user: string; member: APIMember }> = [];
    for (const requirement of giveaway.requirements) {
      if (requirement.type === "GUILD") {
        const member =
          cache.find(
            (entry) =>
              entry.guild === String(requirement.target) &&
              entry.user === user.id
          )?.member ||
          (await this.fetchAPIMember(String(requirement.target), user.id));
        if (member)
          cache.push({
            guild: String(requirement.target),
            user: user.id,
            member
          });
        requirements.push([requirement, Boolean(member)]);
      } else if (requirement.type === "ROLE") {
        const member =
          cache.find(
            (entry) =>
              entry.guild === giveaway.guildId && entry.user === user.id
          )?.member || (await this.fetchAPIMember(giveaway.guildId, user.id));
        if (member)
          cache.push({
            guild: giveaway.guildId,
            user: user.id,
            member
          });
        requirements.push([
          requirement,
          Boolean(member?.roles.includes(String(requirement.target)))
        ]);
      } else if (requirement.type === "VOTE") {
        const voted = await Utils.Lists.hasVotedTopGG(user.id);
        requirements.push([requirement, voted]);
      }
    }
    requirements = requirements.sort(([a], [b]) =>
      a.type > b.type ? 1 : a.type < b.type ? -1 : 0
    );
    if (requirements.find(([_requirement, fullfilled]) => !fullfilled)) {
      // Not all requirements met
      const parts = [];

      for (const [requirement, fullfilled] of requirements) {
        if (requirement.type === "GUILD") {
          const guildDatabase = await Guild.findOne({
            where: { id: String(requirement.target) }
          });
          parts.push(
            `${
              fullfilled ? Utils.Emojis.TICKYES : Utils.Emojis.TICKNO
            } Be a member of **${
              guildDatabase?.name
            }** **[[Invite]](https://discord.gg/${requirement.invite})**`
          );
        } else if (requirement.type === "ROLE") {
          const role = guild.roles.cache.get(String(requirement.target));
          parts.push(
            `${
              fullfilled ? Utils.Emojis.TICKYES : Utils.Emojis.TICKNO
            } Have the role **${role?.name}**`
          );
        } else if (requirement.type === "VOTE") {
          parts.push(
            `${
              fullfilled ? Utils.Emojis.TICKYES : Utils.Emojis.TICKNO
            } Vote for **${
              OpenBump.instance.client.user?.username
            }** **[[Vote]](${Utils.Lists.getLinkTopGG()})**`
          );
        }
      }

      let description =
        `To participate in the giveaway in **${guild?.name}**, you need to...\n` +
        `\n` +
        parts.join(`\n`) +
        `\n` +
        `\n` +
        `After you fullfilled all requirements, you need to **react again** in <#${giveaway.channel}>.`;

      const embed: Discord.MessageEmbedOptions = {
        color: Utils.Colors.ORANGE,
        title: `${Utils.Emojis.IMPORTANTNOTICE} Giveaway Requirements`,
        description,
        footer: {
          text: `You have received this message because you reacted to a giveaway in ${guild?.name}.`
        }
      };
      if (reaction) await reaction.users.remove(user.id).catch(() => void 0);
      await user.send({ embed }).catch(() => void 0);
    } else {
      await user.send("TODO: Success"); // TODO
    }
  }

  private static async fetchAPIMember(
    guild: string,
    member: string
  ): Promise<APIMember | null> {
    const url = `https://discord.com/api/guilds/${guild}/members/${member}`;
    try {
      const res: APIMember = await fetch(url, {
        headers: { Authorization: `Bot ${OpenBump.instance.client.token}` }
      }).then((res) => res.json());
      return res;
    } catch (error) {
      return null;
    }
  }

  public static async cancel(
    giveaway: string | Giveaway,
    guildId: string,
    authorId: string
  ): Promise<Giveaway> {
    if (typeof giveaway === "string")
      giveaway = (await Giveaway.findOne({
        where: { id: giveaway }
      })) as Giveaway;
    if (!giveaway) throw new TitleError(`Error`, `Could not find giveaway.`);
    if (giveaway.guildId !== guildId)
      throw new TitleError(
        "Error",
        "The specified giveaway is not on this server."
      );
    if (giveaway.ended())
      throw new TitleError("Error", "The specified giveaway already ended.");
    const guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
    if (!guild) throw new TitleError("Error", "Could not find server.");
    const channel = guild.channels.cache.get(
      giveaway.channel
    ) as TextBasedGuildChannel;
    if (channel?.type !== "text" && channel?.type !== "news")
      throw new TitleError(
        "Unexpected Error",
        "The type of the giveaway channel is invalid."
      );
    if (!channel) throw new TitleError("Error", "Could not find channel.");
    const message = await channel.messages.fetch(giveaway.id);
    if (!message)
      throw new TitleError("Error", "Could not find giveaway message.");
    giveaway.cancelledBy = authorId;
    const embed = await this.giveawayToEmbed(giveaway);
    await message.edit({ embed });
    await giveaway.save();
    return giveaway;
  }

  public static async startGiveaways() {
    let wait = (5 / 5) * OpenBump.instance.networkManager.total * 2;
    let lastRefresh = 0;
    while (true) {
      const next = lastRefresh + 1000 * wait - Date.now();
      if (next >= 0) await new Promise((resolve) => setTimeout(resolve, next));
      lastRefresh = Date.now();

      const giveaway = await Giveaway.findOne({
        where: {
          [Op.and]: [
            {
              lastRefreshedAt: { [Op.lte]: Date.now() - 1000 * 30 },
              cancelledBy: null,
              endedAt: null
            },
            Sequelize.literal(
              `(\`guildId\` >> 22) % ${OpenBump.instance.networkManager.total} = ${OpenBump.instance.networkManager.id}`
            )
          ]
        },
        order: ["lastRefreshedAt"],
        limit: 1
      });
      if (!giveaway) continue;
      giveaway.lastRefreshedAt = new Date();
      await giveaway.save();

      console.log(
        `[Giveaways] Update giveaway ${giveaway.id} in guild ${giveaway.guildId} with prize ${giveaway.prize}`
      );

      const guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
      if (!guild) continue;
      const channel = guild.channels.cache.get(
        giveaway.channel
      ) as TextBasedGuildChannel;
      if (!channel || (channel.type !== "text" && channel.type !== "news"))
        continue;
      const message = await channel.messages
        .fetch(giveaway.id)
        .catch(() => void 0);
      if (!message) continue;

      const embed = await this.giveawayToEmbed(giveaway).catch(() => {});
      if (!embed) continue;

      if (message.embeds.length) {
        const messageEmbed = message.embeds[0];
        if (
          messageEmbed.title === embed.title &&
          messageEmbed.description === embed.description &&
          messageEmbed.footer?.text === embed.footer?.text &&
          messageEmbed.timestamp?.valueOf() === embed.timestamp?.valueOf()
        )
          continue;
      }

      await message.edit({ embed }).catch(() => {});
    }
  }

  public static async giveawayToEmbed(
    giveaway: Giveaway,
    guild?: Discord.Guild
  ) {
    if (!guild)
      guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
    if (!guild)
      throw new TitleError("Unexpected Error", "Could not find guild");

    const endsAt = new Date(giveaway.createdAt).valueOf() + giveaway.time;

    let description = [];

    if (giveaway.cancelledBy) {
      description.push(`This giveaway has been **cancelled**.`);
    } else {
      description.push(`React with ${Utils.Emojis.TADA} to enter!`);

      description.push(
        `Time remaining: **${ms(endsAt - Date.now(), { long: true })}**`
      );

      giveaway.requirements = giveaway.requirements.sort((a, b) =>
        a.type > b.type ? 1 : a.type < b.type ? -1 : 0
      );
      for (const requirement of giveaway.requirements) {
        if (requirement.type === "GUILD") {
          const requirementGuildDatabase = await Guild.findOne({
            where: { id: requirement.target as string }
          });
          if (!requirementGuildDatabase)
            throw new TitleError(
              "Unexpeced Error",
              "The guild is not in the database."
            );
          description.push(
            `Must join: **[${requirementGuildDatabase?.name}](${requirement.invite})**`
          );
        } else if (requirement.type === "ROLE") {
          const role = guild.roles.cache.get(String(requirement.target));
          if (!role) continue;
          description.push(`Must have role: ${role}`);
        } else if (requirement.type === "VOTE")
          description.push(
            `Must vote for: **[${
              OpenBump.instance.client.user?.username
            }](${Utils.Lists.getLinkTopGG()})**`
          );
        else continue;
      }
    }

    const ended = giveaway.ended();

    const embed: MessageEmbedOptions = {
      color: Utils.Colors.GREEN,
      title: `${Utils.Emojis.GIFT} ${giveaway.prize}`,
      description: description.join("\n"),
      footer: {
        text: ended
          ? `Giveaway ended`
          : `${giveaway.winnersCount} Winner${
              giveaway.winnersCount === 1 ? "" : "s"
            } | Ends at`
      },
      timestamp: ended ? undefined : endsAt
    };

    return embed;
  }
}
