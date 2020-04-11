import Discord, {
  MessageEmbedOptions,
  PermissionString,
  TextChannel
} from "discord.js";
import moment from "moment";
import ms from "ms";
import path from "path";
import { Op } from "sequelize";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";

export type GuildMessage = Discord.Message & {
  channel: Discord.GuildChannel & Discord.TextBasedChannelFields;
};

class Bump {
  private static justRemoved: { [id: string]: number } = {};

  public static getMissingValues(guild: Discord.Guild, guildDatabase: Guild) {
    const missing = [];
    if (!guildDatabase.bumpData.description) missing.push("Description");
    if (!guildDatabase.bumpData.invite) missing.push("Invite");
    return missing.length ? missing : false;
  }

  public static async getEmbed(
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
      if (member.presence?.status === "online") online++;
      else if (member.presence?.status === "dnd") dnd++;
      else if (member.presence?.status === "idle") idle++;
      else offline++;
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

  public static async bumpToAllShards(
    guildDatabase: Guild,
    embed: MessageEmbedOptions
  ) {
    const [internal, external] = await Promise.all([
      OpenBump.instance.networkManager.emitBump(guildDatabase.id, embed),
      this.bumpToThisShard(guildDatabase, embed)
    ]);
    return internal + external;
  }

  public static async bumpToThisShard(
    guildDatabase: Guild,
    embed: MessageEmbedOptions
  ): Promise<number> {
    let guildFeeds = await this.fetchGuildFeeds();

    guildFeeds = guildFeeds.filter(
      (guildFeed) => Boolean(guildFeed.nsfw) == Boolean(guildDatabase.nsfw)
    );

    let amount = 0;

    for (const guildFeed of guildFeeds) {
      if (!guildFeed.feed) continue;

      const guild = OpenBump.instance.client.guilds.cache.get(guildFeed.id);
      if (guild) {
        const channel = guild.channels.cache.get(guildFeed.feed);
        if (channel && channel instanceof TextChannel) {
          const issues = this.getBumpChannelIssues(channel, guildFeed);
          if (!issues.length) {
            try {
              await channel.send({ embed });
              amount++;
            } catch (error) {
              console.error(
                `Unknown hard error occured while trying to bump ${guild.id}: ${error.message}`
              );
            }
          } else {
            if (
              !this.justRemoved[guild.id] ||
              this.justRemoved[guild.id] <= moment().subtract(30, "s").valueOf()
            ) {
              this.justRemoved[guild.id] = Date.now();

              guildDatabase.feed = undefined;
              await guildDatabase.save();

              console.log(
                `Guild ${guild.name} (${guild.id}) had a bump channel set; but there are permission errors!`
              );
              const embed = {
                color: Utils.Colors.RED,
                title: `${Utils.Emojis.XMARK} Bump Error`,
                description: `Hey there, we tried to bump to your bump channel on your server ${guild.name}. However, we had some issues.`,
                fields: [
                  {
                    name: "**Issues**",
                    value:
                      `**Please fix these issues for ${channel} and set the bump channel again:**\n` +
                      issues.map((issue) => `- ${issue}`).join("\n")
                  }
                ]
              };
              try {
                await guild.owner?.user.send({ embed });
              } catch (error) {
                console.error(
                  `Tried to inform the owner ${guild.ownerID} of guild ${guild.name} (${guild.id}) that bumping to their server failed, but failed contacting them. `
                );
              }
            }
          }
        } else {
          // TODO: Inform channel can't be found
          if (
            !this.justRemoved[guild.id] ||
            this.justRemoved[guild.id] <= moment().subtract(30, "s").valueOf()
          ) {
            this.justRemoved[guild.id] = Date.now();

            guildDatabase.feed = undefined;
            await guildDatabase.save();

            const embed = {
              color: Utils.Colors.RED,
              title: `${Utils.Emojis.XMARK} Channel not found`,
              description:
                `Hey there, we tried to bump to your bump channel on your server ${guild.name}. However, we were not able to find the channel. ` +
                `Please fix this issue by setting a new bump channel using \`ob!setchannel <channel>\`.`
            };
            try {
              await guild.owner?.user.send({ embed });
            } catch (error) {
              console.error(
                `Tried to inform the owner ${guild.ownerID} of guild ${guild.name} (${guild.id}) that bumping to their server failed, but failed contacting them.`
              );
            }
          }
        }
      }
    }
    return amount;
  }

  public static async fetchGuildFeeds() {
    const channels = await Guild.scope("feedMetaOnly").findAll({
      where: {
        feed: {
          [Op.and]: [
            {
              [Op.ne]: null
            },
            {
              [Op.ne]: ""
            }
          ]
        }
      }
    });
    return channels;
  }

  public static getBumpChannelIssues(
    channel: Discord.TextChannel,
    guildDatabase: Guild
  ) {
    const { guild } = channel;

    const issues: Array<string> = [];

    const requiredPermissions: Array<{
      permission: PermissionString;
      name: string;
    }> = [
      { permission: "SEND_MESSAGES", name: "Send Messages" },
      { permission: "VIEW_CHANNEL", name: "Read Messages" },
      { permission: "EMBED_LINKS", name: "Embed Links" },
      { permission: "USE_EXTERNAL_EMOJIS", name: "Use External Emojis" }
    ];
    for (const { permission, name } of requiredPermissions) {
      if (
        !channel
          .permissionsFor(String(OpenBump.instance.client.user?.id))
          ?.has(permission)
      )
        issues.push(
          `Please grant \`${OpenBump.instance.client.user?.tag}\` the permission \`${name}\`.`
        );
    }

    if (guildDatabase.nsfw && !channel.nsfw)
      issues.push("Please mark your bump channel as NSFW.");

    if (
      guildDatabase.features.find(
        ({ feature }) => feature === "RESTRICTED_CHANNEL"
      )
    )
      return issues;

    for (const permissionOverwrite of channel.permissionOverwrites.values()) {
      if (permissionOverwrite.type !== "role") continue;
      if (permissionOverwrite.id === guild.id) {
        // everyone role
        if (!permissionOverwrite.allow.has("VIEW_CHANNEL"))
          issues.push(
            `Please grant \`@everyone\` the permission \`Read Messages\`.`
          );
        if (!permissionOverwrite.allow.has("READ_MESSAGE_HISTORY"))
          issues.push(
            `Please grant \`@everyone\` the permission \`Read Message History\`.`
          );
      } else {
        // other role
        if (permissionOverwrite.deny.has("VIEW_CHANNEL"))
          issues.push(
            `Please grant \`@${
              guild.roles.cache.get(permissionOverwrite.id)?.name
            }\` the permission \`Read Messages\``
          );
        if (permissionOverwrite.deny.has("READ_MESSAGE_HISTORY"))
          issues.push(
            `Please grant \`@${
              guild.roles.cache.get(permissionOverwrite.id)?.name
            }\` the permission \`Read Message History\``
          );
      }
    }

    return issues;
  }
}

export default class Utils {
  public static Bump = Bump;

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

  public static errorToEmbed(error: Error): MessageEmbedOptions {
    if (error instanceof EmbedError) return error.toEmbed();
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Unknown error!`,
      description: error.message
    };
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
    else if (matching.length) throw new TooManyResultsError("guilds", matching);
    throw new NotFoundError("guild");
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

export abstract class EmbedError extends Error {
  public abstract toEmbed(): MessageEmbedOptions;
}

export class GuildNotReadyError extends EmbedError {
  constructor(public missing: Array<string>) {
    super("The guild is not ready yet!");
  }

  public toEmbed() {
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Guild not ready!`,
      description:
        "The following fields are missing:\n" +
        this.missing.map((missing) => `- \`${missing}\``).join("\n") +
        "\n" +
        "Check out the command `ob!help` to learn how to set them."
    };
  }
}

export class InviteNotValidError extends EmbedError {
  constructor() {
    super("The guild's invite is not valid!");
  }

  public toEmbed() {
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Invite not valid!`,
      description:
        "It looks like the invite you have set is not valid or does not point to your guild.\n" +
        "Please set a new invite using `ob!setinvite`."
    };
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
