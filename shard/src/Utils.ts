import Color from "color";
import DBL from "dblapi.js";
import Discord, {
  MessageEmbedOptions,
  Permissions,
  PermissionString,
  TextChannel
} from "discord.js";
import moment from "moment";
import fetch from "node-fetch";
import ntc from "ntcjs";
import path from "path";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import config from "./config";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";

class Notifications {
  public static async postGuildAdded(guild: Discord.Guild) {
    return await this.post(
      `${Utils.Emojis.ADD} Joined guild **${guild.name}** [ ${guild.id} ] \`[ Now connected to ${OpenBump.instance.client.guilds.cache.size} servers ]\` - Shard **#${OpenBump.instance.networkManager.id}**`
    );
  }
  public static async postGuildRemoved(guild: Discord.Guild) {
    return await this.post(
      `${Utils.Emojis.REMOVE} Left guild **${guild.name}** [ ${guild.id} ] \`[ Now connected to ${OpenBump.instance.client.guilds.cache.size} servers ]\` - Shard **#${OpenBump.instance.networkManager.id}**`
    );
  }

  private static async post(content: object | string) {
    if (!config.settings.logs?.guilds) return;
    await fetch(config.settings.logs.guilds, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(
        typeof content === "string"
          ? { content }
          : {
              embeds: [content]
            }
      )
    });
  }
}

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
    guildDatabase: Guild,
    authorId?: string,
    preview = false
  ): Promise<MessageEmbedOptions> {
    // Check for missing values
    const missing = this.getMissingValues(guild, guildDatabase);
    if (missing) throw new GuildNotReadyError(missing, guildDatabase);

    // Verify invite
    let invite;
    try {
      invite = await OpenBump.instance.client.fetchInvite(
        guildDatabase.bumpData.invite
      );
    } catch (error) {
      throw new InviteNotValidError(guildDatabase);
    }
    if (!invite.guild?.id || invite.guild.id !== guild.id)
      throw new InviteNotValidError(guildDatabase);

    // Prepare data
    let total = 0;
    let online = 0;
    let dnd = 0;
    let idle = 0;
    let offline = 0;
    let bots = 0;
    let humans = 0;
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
      else humans++;
    }

    roles = guild.roles.cache.size;
    channels = guild.channels.cache.size;
    emojis = guild.emojis.cache.size;

    // Color
    let color = Utils.Colors.OPENBUMP;
    if (guildDatabase.getFeatures().includes(Utils.Feature.COLOR))
      color = guildDatabase.bumpData.color ?? color;

    // Banner
    let banner: string | undefined = undefined;
    if (guildDatabase.getFeatures().includes(Utils.Feature.BANNER))
      banner = guildDatabase.bumpData.banner ?? banner;

    // Region
    const regions = await guild.fetchVoiceRegions();
    const region = regions.get(guild.region);

    // Description
    let description =
      `${Utils.Emojis.OWNER} **Owner:** \`${guild.owner?.user.tag}\`\n` +
      `${Utils.Emojis.REGION} **Region:** \`${region?.name}\`\n` +
      `${Utils.Emojis.CREATED} **Created:** \`${moment(
        guild.createdTimestamp
      ).format("ddd, DD MMM YYYY")}\`\n` +
      `\n` +
      `${guildDatabase.bumpData.description}` +
      `\n\n` +
      `${Utils.Emojis.SLINK} **[CLICK HERE TO JOIN](${invite})**`;

    // Author
    if (!authorId) authorId = String(OpenBump.instance.client.user?.id);
    const author = await OpenBump.instance.client.users.fetch(authorId);

    // Badges
    const features = guildDatabase.getFeatures();
    const badges = [];
    if (features.includes(Utils.Feature.SUPPORT_SERVER))
      badges.push(Utils.Emojis.SUPPORT_SERVER);
    if (guild.verified) badges.push(Utils.Emojis.VERIFIED_SERVER);
    if (guild.partnered) badges.push(Utils.Emojis.PARTNERED_SERVER);
    if (features.includes(Utils.Feature.BOOSTER_PREMIUM))
      badges.push(Utils.Emojis.BOOSTER_PREMIUM);
    if (features.includes(Utils.Feature.PREMIUM))
      badges.push(Utils.Emojis.PREMIUM);
    if (features.includes(Utils.Feature.AUTOBUMP) && guildDatabase.autobump)
      badges.push(Utils.Emojis.AUTOBUMP);
    if (features.includes(Utils.Feature.FEATURED))
      badges.push(Utils.Emojis.FEATURED);
    if ((guild.premiumSubscriptionCount || 0) >= 30)
      badges.push(Utils.Emojis.BOOST_3);
    else if ((guild.premiumSubscriptionCount || 0) >= 15)
      badges.push(Utils.Emojis.BOOST_2);
    else if ((guild.premiumSubscriptionCount || 0) >= 2)
      badges.push(Utils.Emojis.BOOST_1);

    if (badges.length) {
      description = badges.join(" ") + `\n\n` + description;
    }

    // Create
    return {
      title: `**${guild.name}**`,
      thumbnail: {
        url: guild.iconURL({ dynamic: true }) || undefined
      },
      color,
      description,
      fields: [
        {
          name: `${Utils.Emojis.MEMBERS} Members \`${total}\``,
          value:
            `**Online:** \`${online}\` | ` +
            `**Idle:** \`${idle}\` | ` +
            `**Do Not Disturb:** \`${dnd}\``
        },
        {
          name: `${Utils.Emojis.INFO} Misc`,
          value:
            `**Roles:** \`${roles}\` | ` +
            `**Channels:** \`${channels}\` | ` +
            `**Bots:** \`${bots}\` | ` +
            `**Humans:** \`${humans}\``
        },
        {
          name: `${Utils.Emojis.EMOJIS} Total Emojis \`${emojis}\``,
          value:
            Array.from(guild.emojis.cache.values())
              .slice(0, 10)
              .map(String)
              .join(" ") || "*No Emojis*"
        }
      ],
      image: {
        url: banner
      },
      footer: {
        icon_url: author.displayAvatarURL({ dynamic: true }),
        text:
          author.id !== OpenBump.instance.client.user?.id
            ? `${!preview ? "Bumped by" : "Preview by"} ${author.tag}`
            : "Server Being Auto Bumped By The System"
      },
      timestamp: Date.now()
    };
  }

  public static async bump(guildDatabase: Guild, embed: MessageEmbedOptions) {
    const sandbox = guildDatabase.sandbox;
    const cross = guildDatabase.getFeatures().includes(Utils.Feature.CROSS);
    const [internal, external] = await Promise.all([
      this.bumpToThisShard(
        guildDatabase,
        embed,
        sandbox ? this.BumpType.SANDBOX : this.BumpType.CROSS
      ),
      OpenBump.instance.networkManager.emitBump(
        guildDatabase.id,
        embed,
        sandbox
          ? this.BumpType.SANDBOX
          : cross
          ? this.BumpType.CROSS
          : this.BumpType.HUBS
      )
    ]);
    if (sandbox) await new Promise((resolve) => setTimeout(resolve, 1000 * 10));
    return { amount: internal.length + external, featured: internal };
  }

  public static async bumpToThisShard(
    guildDatabase: Guild,
    embed: MessageEmbedOptions,
    type: keyof typeof Bump.BumpType
  ): Promise<Array<Guild>> {
    let guildFeeds: Array<Guild>;

    console.debug(
      `[DEBUG] Shard ${OpenBump.instance.networkManager.id} is bumping ${guildDatabase.name} (${guildDatabase.id}) (type=${type})`
    );

    if (type === Bump.BumpType.HUBS) {
      guildFeeds = await this.fetchGuildFeeds(0, true, guildDatabase.id);
    } else if (type === Bump.BumpType.CROSS) {
      guildFeeds = await this.fetchGuildFeeds(50, true, guildDatabase.id);
    } else if (type === Bump.BumpType.FULL) {
      guildFeeds = await this.fetchGuildFeeds(-1, true, guildDatabase.id);
    } else if (type === Bump.BumpType.SANDBOX) {
      guildFeeds = await this.fetchGuildFeeds(0, false, guildDatabase.id);
    } else
      throw new Error("This error should never be thrown; Invalid bump type.");

    console.debug(
      `[DEBUG] Attempting to bump to ${guildFeeds.length} guilds...`
    );

    guildFeeds = guildFeeds.filter(
      (guildFeed) => Boolean(guildFeed.nsfw) == Boolean(guildDatabase.nsfw)
    );

    const bumpedTo: Array<Guild> = [];

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
              bumpedTo.push(guildFeed);
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

              guildFeed.feed = null;
              await guildFeed.save();

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
          if (
            !this.justRemoved[guild.id] ||
            this.justRemoved[guild.id] <= moment().subtract(30, "s").valueOf()
          ) {
            this.justRemoved[guild.id] = Date.now();

            guildFeed.feed = null;
            await guildFeed.save();

            console.log(
              `Guild ${guild.name} (${guild.id}) had a bump channel set; but we couldn't find it!`
            );

            const embed = {
              color: Utils.Colors.RED,
              title: `${Utils.Emojis.XMARK} Channel not found`,
              description:
                `Hey there, we tried to bump to your bump channel on your server ${guild.name}. However, we were not able to find the channel. ` +
                `Please fix this issue by setting a new bump channel using \`${Utils.getPrefix(
                  guildDatabase
                )}setchannel <channel>\`.`
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
      } else {
        guildFeed.lastFailedAt = new Date();
        await guildFeed.save();
        console.debug(
          `[DEBUG] Skipped and marked guild ${guildFeed.name} (${guildFeed.id}) because it can't be found in cache.`
        );
      }
    }
    return bumpedTo;
  }

  public static async fetchGuildFeeds(
    amount = -1,
    hubs = true,
    include?: string
  ) {
    const feedChannels =
      amount !== 0
        ? await Guild.scope("default").findAll({
            where: {
              [Op.and]: [
                {
                  feed: {
                    [Op.and]: [
                      {
                        [Op.ne]: null
                      },
                      {
                        [Op.ne]: ""
                      }
                    ]
                  },
                  [Op.or]: [
                    {
                      lastFailedAt: null
                    },
                    {
                      lastFailedAt: {
                        [Op.lte]: moment().subtract(1, "day").valueOf()
                      }
                    }
                  ],
                  blocked: null
                },
                Sequelize.literal(
                  `(\`id\` >> 22) % ${OpenBump.instance.networkManager.total} = ${OpenBump.instance.networkManager.id}`
                )
              ]
            },
            ...(amount >= 0
              ? {
                  order: [Sequelize.literal("rand()")],
                  limit: amount
                }
              : {})
          })
        : [];
    const hubChannels =
      (hubs && amount >= 0 && feedChannels.length >= amount) || include
        ? await Guild.scope("default").findAll({
            where: {
              [Op.and]: [
                {
                  [Op.or]: [
                    ...(hubs ? [{ hub: true }] : []),
                    ...(include ? [{ id: include }] : [])
                  ],
                  id: {
                    [Op.notIn]: feedChannels.map(({ id }) => id)
                  },
                  feed: {
                    [Op.and]: [
                      {
                        [Op.ne]: null
                      },
                      {
                        [Op.ne]: ""
                      }
                    ]
                  },
                  blocked: null
                },
                Sequelize.literal(
                  `(\`Guild\`.\`id\` >> 22) % ${OpenBump.instance.networkManager.total} = ${OpenBump.instance.networkManager.id}`
                )
              ]
            }
          })
        : [];
    return [...feedChannels, ...hubChannels];
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

    if (guildDatabase.getFeatures().includes(Utils.Feature.RESTRICTED_CHANNEL))
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

  public static BumpType = {
    HUBS: "HUBS" as "HUBS",
    CROSS: "CROSS" as "CROSS",
    FULL: "FULL" as "FULL",
    SANDBOX: "SANDBOX" as "SANDBOX"
  };

  public static startAutobump() {
    setTimeout(() => {
      Bump.autobumpLoop.bind(this);
      Bump.startAutobump();
    }, 1000 * 30);
    Bump.autobumpLoop();
  }

  private static async autobumpLoop() {
    console.log("Running autobump loop...");

    try {
      const autobumpable = await Guild.scope("default").findAll({
        where: {
          [Op.and]: [
            {
              autobump: true,
              blocked: null
            },
            Sequelize.literal(
              `(\`Guild\`.\`id\` >> 22) % ${OpenBump.instance.networkManager.total} = ${OpenBump.instance.networkManager.id}`
            )
          ]
        }
      });

      console.debug(
        `[DEBUG] Loaded ${autobumpable.length} guilds with autobump enabled`
      );

      for (const guildDatabase of autobumpable) {
        try {
          if (!guildDatabase.getFeatures().includes(Utils.Feature.AUTOBUMP)) {
            guildDatabase.autobump = false;
            await guildDatabase.save();
            continue;
          }
          const cooldown = guildDatabase.getCooldown(true);
          const nextBump = guildDatabase.lastBumpedAt
            ? guildDatabase.lastBumpedAt.valueOf() + cooldown
            : 0;
          if (nextBump && nextBump > Date.now()) {
            console.debug(
              `[DEBUG] Guild ${guildDatabase.name} (${
                guildDatabase.id
              }) is still on cooldown. (nextBump=${nextBump},displayNextBump=${moment(
                nextBump
              ).format()})`
            );
            continue;
          }

          const guild = OpenBump.instance.client.guilds.cache.get(
            guildDatabase.id
          );
          if (!guild) {
            console.debug(
              `[DEBUG] Guild ${guildDatabase.name} (${guildDatabase.id}) is not cached on shard #${OpenBump.instance.networkManager.id}, continue autobump`
            );
            continue;
          }

          console.debug(
            `[DEBUG] Guild ${guildDatabase.name} (${guildDatabase.id}) is now being autobumped...`
          );
          await Bump.bump(
            guildDatabase,
            await Bump.getEmbed(guild, guildDatabase)
          );

          guildDatabase.lastBumpedAt = new Date();
          guildDatabase.lastBumpedBy = OpenBump.instance.client.user?.id;
          guildDatabase.lastBumpedWith = OpenBump.instance.client.user?.id;
          await guildDatabase.save();
        } catch (error) {
          if (!(error instanceof InviteNotValidError))
            console.error(
              `Error while autobumping ${guildDatabase?.id}:`,
              error
            );
        }
      }
    } catch (error) {
      console.error(`Error in general autobump loop:`, error);
    }
  }
}

class Lists {
  private static dbl?: DBL = undefined;
  private static dblWeekend = false;

  public static start() {
    this.startTopGG();
  }

  private static startTopGG() {
    if (!config.lists?.topgg?.enabled) return;
    this.dbl = new DBL(config.lists.topgg.token, OpenBump.instance.client);

    this.dbl.on("posted", () => console.log("Server count posted to top.gg"));
    this.dbl.on("error", (error) =>
      console.error("Error while posting stats to top.gg:", error)
    );

    this.loopPostTopGG();

    console.log("Started top.gg");
  }

  private static async loopPostTopGG() {
    try {
      this.dblWeekend = (await this.dbl?.isWeekend()) || false;
      await this.dbl?.postStats(
        OpenBump.instance.client.guilds.cache.size,
        OpenBump.instance.networkManager.id,
        OpenBump.instance.networkManager.total
      );
      console.log("Successfully posted server count to top.gg");
    } catch (error) {
      console.error("Error while posting server count to top.gg:", error);
    }
    setTimeout(() => this.loopPostTopGG(), 1000 * 60 * 15);
  }

  public static async hasVotedTopGG(user: string): Promise<boolean> {
    if (!this.dbl) return false;
    try {
      return await this.dbl.hasVoted(user);
    } catch (error) {
      return false;
    }
  }

  public static isWeekendTopGG() {
    return this.dblWeekend;
  }

  public static getLinkTopGG() {
    return `https://top.gg/bot/${OpenBump.instance.client.user?.id}/vote`;
  }
}

export default class Utils {
  public static Notifications = Notifications;
  public static Bump = Bump;
  public static Lists = Lists;

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

  public static getCommonFooter() {
    return `Shard #${OpenBump.instance.networkManager.id} | Shard Guilds: ${OpenBump.instance.client.guilds.cache.size} | Shard Latency: ${OpenBump.instance.client.ws.ping}`;
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

  public static getPrefix(guild?: Guild) {
    if (guild?.getFeatures().includes("PREFIX") && guild.prefix)
      return guild.prefix;
    return config.settings.prefix;
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
    GREEN: 0x337ed8,
    ORANGE: 0xff9900,
    OPENBUMP: 0
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
    SUPPORT_SERVER: "SUPPORT_SERVER" as "SUPPORT_SERVER",
    BOOSTER_PREMIUM: "BOOSTER_PREMIUM" as "BOOSTER_PREMIUM",
    PREMIUM: "PREMIUM" as "PREMIUM"
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
    ADD: "\\✔️",
    REMOVE: "\\➖",
    THUMBSUP: "<:thumbsup:631606538598875174>",
    THUMBSDOWN: "<:thumbsdown:631606537827123221>",
    OWNER: "<:owner:547102770696814592>",
    REGION: "<:region:547102740799553615>",
    CREATED: "<:created:547102739503644672>",
    SLINK: "<:link:688700604448505917>",
    MEMBERS: "<:members:688700604431728698>",
    INFO: "<:error:678624265276358696>",
    EMOJIS: "<:pys_happy:688700604935307361>",
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
    FEATURED: "<:featured:707640423895662753>",
    UNITEDSERVER: "<:UnitedServer:622845429435858955>",
    EARLYSUPPORTER: "<:EarlySupporter:622852038031835137>",
    AFFILIATEDSERVER: "<:AffiliatedServer:622857526924279848>",
    BUMPCHANNEL: "<:BumpChannel:632703590632390686>",
    SUPPORT_SERVER: "<:official_support:707638686724128880>",
    VERIFIED_SERVER: "<:verified:707638692885430422>",
    PARTNERED_SERVER: "<:partner:707638685742661714>",
    BOOSTER_PREMIUM: "<a:extream_premium:707638690188624010>",
    PREMIUM: "<:premium:707638689869856768>",
    AUTOBUMP: "<:autobump:707638684123660366>",
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

export class GuildNotReadyError extends EmbedError {
  constructor(public missing: Array<string>, public guild: Guild) {
    super("The guild is not ready yet!");
  }

  public toEmbed() {
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Guild not ready!`,
      description:
        "The following fields are missing:\n" +
        this.missing.map((missing) => `- \`${missing}\``).join("\n") +
        "\n\n" +
        `Check out the command \`${Utils.getPrefix(
          this.guild
        )}help\` to learn how to set them.`
    };
  }
}

export class InviteNotValidError extends EmbedError {
  constructor(public guild: Guild) {
    super("The guild's invite is not valid!");
  }

  public toEmbed() {
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Invite not valid!`,
      description:
        "It looks like the invite you have set is not valid or does not point to your guild.\n" +
        `Please set a new invite using \`${Utils.getPrefix(
          this.guild
        )}setinvite\`.`
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

export class RestrictedFeatureError extends EmbedError {
  constructor(
    public feature:
      | Array<keyof typeof Utils.Feature>
      | keyof typeof Utils.Feature,
    public guild: Guild
  ) {
    super(`This is a premium feature`);
  }

  public toEmbed() {
    return {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.LOCKKEY} Premium Feature`,
      description:
        `This is a premium feature.\n` +
        `Use the command \`${Utils.getPrefix(
          this.guild
        )}premium\` to view more information about premium.`
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
