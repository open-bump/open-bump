import Color from "color";
import Discord, { MessageEmbedOptions, Permissions } from "discord.js";
import ntc from "ntcjs";
import path from "path";
import Guild from "./models/Guild";
import Reminder from "./models/Reminder";
import User from "./models/User";
import OpenBump from "./OpenBump";

export type GuildMessage = Discord.Message & {
  channel: Discord.GuildChannel & Discord.TextBasedChannelFields;
  member: Discord.GuildMember;
  guild: Discord.Guild;
};

export interface RawGuildMessage {
  id: string;
  author: {
    id: string;
  };
  guild: {
    id: string;
  };
  channel: {
    id: string;
  };
}

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

  public static guildMessageToRaw(message: GuildMessage): RawGuildMessage {
    return {
      id: message.id,
      author: {
        id: message.author.id
      },
      guild: {
        id: message.guild.id
      },
      channel: {
        id: message.channel.id
      }
    };
  }

  /**
   * Random number inclusive 0 and exclusive range
   */
  public static randomInt(range: number): number {
    return Math.floor(Math.random() * Math.floor(range));
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
    if (!OpenBump.instance.ready) {
      console.log("Delaying guild ensuring until client is ready...");
      while (!OpenBump.instance.ready) {}
      console.log("Continuing guild ensuring, client is ready now.");
    }

    try {
      const existingGuild = await Guild.scope("default").findOne({
        where: { id: guild.id }
      });
      if (existingGuild) {
        existingGuild.name = guild.name;
        if (existingGuild.changed()) await existingGuild.save({});
        return existingGuild;
      } else {
        const newGuild = await Guild.scope("default").create({
          id: guild.id,
          name: guild.name
        });
        const finalGuild = await Guild.scope("default").findOne({
          where: { id: guild.id }
        });
        return finalGuild || newGuild; // Use "finalGuild" with more data; and as fallback "newGuild"
      }
    } catch (error) {
      console.error(
        `Error while ensuring guild, no transaction, not rolling back...`
      );
      throw error;
    }
  }

  public static getInviteLink() {
    return `https://discordapp.com/api/oauth2/authorize?client_id=${OpenBump.instance.client.user?.id}&permissions=379969&scope=bot`;
  }

  public static getShardId(guildId: string, shards: number) {
    const nGuildId = BigInt(guildId);
    return Number((nGuildId >> BigInt(22)) % BigInt(shards));
  }

  public static errorToEmbed(error: Error): MessageEmbedOptions {
    if (error instanceof EmbedError) return error.toEmbed();
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} ${
        error instanceof TitleError ? error.title : "Unknown error"
      }`,
      description: error.message
    };
  }

  public static niceList(array: Array<string>) {
    if (array.length <= 2) return array.join(" and ");
    return (
      array.slice(0, array.length - 1).join(", ") +
      ` and ${array[array.length - 1]}`
    );
  }

  public static formatCurrency(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  public static findChannel(
    input: string,
    guild: Discord.Guild,
    type?: Array<string>
  ) {
    const channels = Array.from(guild.channels.cache.values()).filter(
      (channel) => !type || type.includes(channel.type)
    );

    let matching = channels.filter(
      (channel) => channel.id === input.replace(/[^0-9]/gim, "")
    );

    if (!matching.length)
      matching = channels.filter((channel) => channel.name === input);
    if (!matching.length)
      matching = channels.filter((channel) => channel.name.includes(input));

    if (matching.length === 1) return matching[0];
    else if (matching.length)
      throw new TooManyResultsError("channels", matching);
    throw new NotFoundError("guild");
  }

  public static escapeLike(value: string) {
    return value.replace(/(_|%|\\)/g, "\\$1");
  }

  public static textToColor(input: string): number {
    return Color(input).rgbNumber();
  }

  public static colorToText(input: number, named = true): string {
    const hex = Color(input).hex();
    const [, name, exact] = ntc.name(hex);
    return exact && named ? name : hex;
  }

  public static getPermissionIdentifiers(
    permission: Discord.PermissionResolvable
  ): Discord.PermissionString[] {
    const permissions = new Discord.Permissions(permission);
    if (permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR))
      return ["ADMINISTRATOR"];
    return permissions.toArray();
  }

  public static translatePermission(permission: Discord.PermissionString) {
    return Utils.PermissionsNames[permission];
  }

  public static shuffleArray<T>(array: Array<T>) {
    let currentIndex = array.length,
      temporaryValue,
      randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  public static async remind(user: User, guild: Guild, channel: string) {
    return await Reminder.upsert({
      guildId: guild.id,
      userId: user.id,
      channel
    });
  }

  public static PermissionsNames: {
    [id in Discord.PermissionString]: string;
  } = {
    ADD_REACTIONS: "Add Reactions",
    ADMINISTRATOR: "Administrator",
    ATTACH_FILES: "Attach Files",
    BAN_MEMBERS: "Ban Members",
    CHANGE_NICKNAME: "Change Nickname",
    CONNECT: "Connect",
    CREATE_INSTANT_INVITE: "Create Invite",
    DEAFEN_MEMBERS: "Deafen Members",
    EMBED_LINKS: "Embed Links",
    KICK_MEMBERS: "Kick Members",
    MANAGE_CHANNELS: "Manage Channels",
    MANAGE_EMOJIS: "Manage Emojis",
    MANAGE_GUILD: "Manage Server",
    MANAGE_MESSAGES: "Manage Messages",
    MANAGE_NICKNAMES: "Manage Nicknames",
    VIEW_CHANNEL: "Read Text Channels & See Voice Channels",
    VIEW_AUDIT_LOG: "View Audit Log",
    MANAGE_ROLES: "Manage Roles",
    MANAGE_WEBHOOKS: "Manage Webhooks",
    MENTION_EVERYONE: "Mention @everyone, @here, and All Roles",
    MOVE_MEMBERS: "Move Members",
    MUTE_MEMBERS: "Mute Members",
    PRIORITY_SPEAKER: "Priority Speaker",
    READ_MESSAGE_HISTORY: "Read Message History",
    SEND_MESSAGES: "Send Messages",
    SEND_TTS_MESSAGES: "Send TTS Messages",
    SPEAK: "Speak",
    STREAM: "Video",
    USE_EXTERNAL_EMOJIS: "Use External Emojis",
    USE_VAD: "Use Voice Activity",
    VIEW_GUILD_INSIGHTS: "View Guild Insights"
  };

  public static Colors = {
    BLUE: 0x698cce,
    RED: 0xff0000,
    GREEN: 0x3dd42c,
    ORANGE: 0xff9900,
    OPENBUMP: 0x27ad60
  };

  public static BumpProvider = {
    SANDBOX: "SANDBOX" as "SANDBOX"
  };

  public static Feature = {
    COLOR: "COLOR" as "COLOR",
    BANNER: "BANNER" as "BANNER",
    PREFIX: "PREFIX" as "PREFIX",
    FEATURED: "FEATURED" as "FEATURED",
    CROSS: "CROSS" as "CROSS",
    RESTRICTED_CHANNEL: "RESTRICTED_CHANNEL" as "RESTRICTED_CHANNEL",
    AUTOBUMP: "AUTOBUMP" as "AUTOBUMP",
    SUPPORT_SERVER: "SUPPORT_SERVER" as "SUPPORT_SERVER"
  };

  public static Emojis = {
    LOCK: "🔒",
    LOCKKEY: "🔐",
    LOCKOPEN: "🔓",
    ZAP: "⚡",
    BELL: "🔔",
    STAR: "⭐",
    CLOCK: "🕐",
    ARROWRIGHT: "➡",
    INFORMATION: "ℹ",
    EXCLAMATION: "❗",
    MAILBOX: "📬",
    SBLP: "🌀",
    WAVE: "👋",
    ADD: "\\✔️",
    REMOVE: "\\➖",
    REMINDER: "⏰",
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
    IMPORTANTNOTICE: "⚠️",
    FEATURED: "<:FeaturedServer:622845429045919745>",
    UNITEDSERVER: "<:UnitedServer:622845429435858955>",
    EARLYSUPPORTER: "<:EarlySupporter:622852038031835137>",
    AFFILIATEDSERVER: "<:AffiliatedServer:622857526924279848>",
    BUMPCHANNEL: "<:BumpChannel:632703590632390686>",
    SUPPORT_SERVER: "<:official_support:707638686724128880>",
    VERIFIED_SERVER: "<:verified:707638692885430422>",
    PARTNERED_SERVER: "<:partner:707638685742661714>",
    BOOST_3: "<:boost_3:707638684555411578>",
    BOOST_2: "<:boost_2:707638684530507907>",
    BOOST_1: "<:boost_1:707638684358410271>",
    getRaw: (emoji: string) => {
      const regex = /<a?:.{0,}:([0-9]{10,20})>/gim;
      let m;

      while ((m = regex.exec(emoji)) !== null) {
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        let res: string | null = null;
        m.forEach((match, groupIndex) => {
          if (groupIndex === 1) res = match;
        });
        return res || emoji;
      }

      return emoji;
    }
  };
}

export abstract class EmbedError extends Error {
  public abstract toEmbed(): MessageEmbedOptions;
}

export class TitleError extends Error {
  constructor(public title: string, message: string) {
    super(message);
  }

  public static create(title: string, error: Error | string) {
    return new TitleError(
      title,
      error instanceof Error ? error?.message || String(error) : error
    );
  }
}

export class NotFoundError extends EmbedError {
  constructor(private type: string) {
    super(`Could not find ${type}!`);
  }

  public toEmbed() {
    return {
      color: Utils.Colors.RED,
      title: `Can't find ${this.type}!`,
      description: "Please specify your input."
    };
  }
}

export class TooManyResultsError<T> extends EmbedError {
  constructor(private type: string, public results?: Array<T>) {
    super(`Too many ${type} found!`);
  }

  public toEmbed() {
    return {
      color: Utils.Colors.RED,
      title: `Too many ${this.type} found!`,
      description: "Please specify your input."
    };
  }
}

export class UserPermissionError extends EmbedError {
  public required: Discord.Permissions;
  public missing: Discord.Permissions;

  constructor(
    required: Discord.PermissionResolvable,
    has?: Discord.PermissionResolvable
  ) {
    super("You do not have enough permissions to execute this command");
    this.required = new Discord.Permissions(required);
    if (has) {
      this.missing = new Discord.Permissions(
        this.required.bitfield & ~new Discord.Permissions(has).bitfield
      );
    } else this.missing = new Permissions(required);
  }

  public toEmbed() {
    const identifiers = Utils.getPermissionIdentifiers(this.missing);
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Missing Access`,
      description: `To execute this command, you need to have the permission${
        identifiers.length === 1 ? "" : "s"
      } ${Utils.niceList(
        identifiers.map(Utils.translatePermission).map((name) => `\`${name}\``)
      )}.`
    };
  }
}
