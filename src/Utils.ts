import Discord, { MessageEmbedOptions } from "discord.js";
import ms from "ms";
import path from "path";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";

export type GuildMessage = Discord.Message & {
  channel: Discord.GuildChannel & Discord.TextBasedChannelFields;
};

export default class Utils {
  public static mergeObjects<T extends object = object>(
    target: T,
    ...sources: Array<T>
  ): T {
    if (!sources.length) return target;
    const source = sources.shift() as any | undefined;
    if (source === undefined) return target;

    if (this.isMergeableObject(target) && this.isMergeableObject(source)) {
      Object.keys(source).forEach((key: string) => {
        if (this.isMergeableObject(source[key])) {
          if (!(target as any)[key]) (target as any)[key] = {};
          this.mergeObjects((target as any)[key], source[key]);
        } else {
          (target as any)[key] = source[key];
        }
      });
    }
    return this.mergeObjects(target, ...sources);
  }

  public static isObject(item: any): boolean {
    return item !== null && typeof item === "object";
  }

  public static isMergeableObject(item: object): boolean {
    return this.isObject(item) && !Array.isArray(item);
  }

  public static getPackageJson() {
    try {
      return require(path.join(OpenBump.instance.directory, "package.json"));
    } catch (error) {}
    try {
      return require(path.join(
        OpenBump.instance.directory,
        "..",
        "package.json"
      ));
    } catch (error) {}
    throw new Error(`Can't load package.json!`);
  }

  public static async ensureGuild(guild: Discord.Guild): Promise<Guild> {
    const databaseManager = OpenBump.instance.databaseManager;
    const transaction = await databaseManager.sequelize.transaction();
    try {
      const existingGuild = await Guild.findOne({
        where: { id: guild.id },
        transaction
      });
      if (existingGuild) {
        existingGuild.name = guild.name;
        if (existingGuild.changed()) await existingGuild.save({ transaction });
        await transaction.commit();
        return existingGuild;
      } else {
        const newGuild = await Guild.create(
          {
            id: guild.id,
            name: guild.name
          },
          { transaction }
        );
        await transaction.commit();
        const finalGuild = await Guild.findOne({
          where: { id: guild.id }
        });
        return finalGuild || newGuild; // Use "finalGuild" with more data; and as fallback "newGuild"
      }
    } catch (error) {
      console.error(`Error while ensuring guild, rolling back...`);
      await transaction.rollback();
      throw error;
    }
  }

  public static getInviteLink() {
    return `https://discordapp.com/api/oauth2/authorize?client_id=${OpenBump.instance.client.user?.id}&permissions=379969&scope=bot`;
  }

  public static Colors = {
    BLUE: 0x698cce,
    RED: 0xff0000,
    GREEN: 0x3dd42c,
    ORANGE: 0xff9900,
    OPENBUMP: 0x27ad60
  };

  public static Emojis = {
    LOCK: "🔒",
    LOCKKEY: "🔐",
    LOCKOPEN: "🔓",
    ZAP: "⚡",
    BELL: "🔔",
    STAR: "⭐",
    ARROWRIGHT: "➡",
    INFORMATION: "ℹ",
    MAILBOX: "📬",
    THUMBSUP: "<:thumbsup:631606538598875174>",
    THUMBSDOWN: "<:thumbsdown:631606537827123221>",
    OWNER: "<:owner:547102770696814592>",
    REGION: "<:region:547102740799553615>",
    CREATED: "<:created:547102739503644672>",
    SLINK: "<:slink:547112000778403844>",
    MEMBERS: "<:members:547112000765821039>",
    INFO: "<:info:547112000765820949>",
    ONLINE: "<:online:546621462715301888>",
    DND: "<:dnd:546621462434414593>",
    IDLE: "<:idle:546621462677684225>",
    STREAMING: "<:streaming:547114192646176793>",
    INVISIBLE: "<:invisible:546621324131565574>",
    LOADING: "<a:loading:547809249552760842>",
    LOADINGGREEN: "<a:loading:631962121256566795>",
    CHECK: "<:check:621063206235930634>",
    XMARK: "<:xmark:621063205854380086>",
    UNSET: "<:neutral:621063802028294155>",
    NEUTRAL: "<:neutral:621063205854380057>",
    IMPORTANTNOTICE: "<:importantnotice:621049166759460884>",
    FEATURED: "<:FeaturedServer:622845429045919745>",
    UNITEDSERVER: "<:UnitedServer:622845429435858955>",
    EARLYSUPPORTER: "<:EarlySupporter:622852038031835137>",
    AFFILIATEDSERVER: "<:AffiliatedServer:622857526924279848>",
    BUMPCHANNEL: "<:BumpChannel:632703590632390686>"
  };
}

class Bump {
  public getMissingValues(guild: Discord.Guild, guildDatabase: Guild) {
    const missing = [];
    if (!guildDatabase.bumpData.description) missing.push("Description");
    if (!guildDatabase.bumpData.invite) missing.push("Invite");
    return missing.length ? missing : false;
  }

  public async getEmbed(
    guild: Discord.Guild,
    guildDatabase: Guild
  ): Promise<MessageEmbedOptions> {
    // Check for missing values
    const missing = this.getMissingValues(guild, guildDatabase);
    if (missing) throw new GuildNotReadyError(missing);

    // Verify invite
    let invite;
    try {
      invite = await OpenBump.instance.client.fetchInvite(
        guildDatabase.bumpData.invite
      );
    } catch (error) {
      throw new InviteNotValidError();
    }
    if (!invite.guild?.id || invite.guild.id !== guild.id)
      throw new InviteNotValidError();

    // Prepare data
    let total = 0;
    let online = 0;
    let dnd = 0;
    let idle = 0;
    let offline = 0;
    let bots = 0;
    let roles = 0;
    let channels = 0;
    let emojis = 0;

    for (const member of guild.members.cache.values()) {
      if (member.presence) {
        if (member.presence.status === "online") online++;
        else if (member.presence.status === "dnd") online++;
        else if (member.presence.status === "idle") idle++;
      } else offline++;
      total++;
      if (member.user.bot) bots++;
    }

    roles = guild.roles.cache.size;
    channels = guild.channels.cache.size;
    emojis = guild.emojis.cache.size;

    // Color
    const color = Utils.Colors.OPENBUMP;

    // Region
    const regions = await guild.fetchVoiceRegions();
    const region = regions.get(guild.region);

    // Description
    const description =
      `${Utils.Emojis.OWNER} **Owner:** ${guild.owner?.user.tag}\n` +
      `${Utils.Emojis.REGION} **Region:** ${region?.name}\n` +
      `${Utils.Emojis.CREATED} **Created:** ${ms(
        Date.now() - guild.createdTimestamp,
        { long: true }
      )} ago\n` +
      `\n` +
      `${guildDatabase.bumpData.description}`;

    // Create
    return {
      title: `**${guild.name}**`,
      thumbnail: {
        url: guild.iconURL() || undefined
      },
      color,
      description,
      fields: [
        {
          name: `${Utils.Emojis.SLINK} **Invite Link**`,
          value: `**${invite}**`
        },
        {
          name: `${Utils.Emojis.MEMBERS} **Members [${total}]**`,
          value:
            `${Utils.Emojis.ONLINE} **Online:** ${online}\n` +
            `${Utils.Emojis.DND} **Do Not Disturb:** ${dnd}\n` +
            `${Utils.Emojis.IDLE} **Idle:** ${idle}\n` +
            `${Utils.Emojis.INVISIBLE} **Offline:** ${offline}`,
          inline: true
        },
        {
          name: `${Utils.Emojis.INFO} **Misc**`,
          value:
            `**Roles:** ${roles}\n` +
            `**Bots:** ${bots}\n` +
            `**Channels:** ${channels}\n` +
            `**Emojis:** ${emojis}`,
          inline: true
        }
      ]
    };
  }
}

class GuildNotReadyError extends Error {
  constructor(public missing: Array<string>) {
    super("The guild is not ready yet!");
  }
}

class InviteNotValidError extends Error {
  constructor() {
    super("The guild's invite is not valid!");
  }
}
