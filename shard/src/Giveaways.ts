import Discord, { MessageEmbedOptions, MessageReaction } from "discord.js";
import ms from "ms";
import fetch, { Response } from "node-fetch";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { IGuildMemberRemoveEvent } from "./events/RawEvent";
import Giveaway from "./models/Giveaway";
import GiveawayParticipant from "./models/GiveawayParticipant";
import GiveawayRequirement from "./models/GiveawayRequirement";
import Guild from "./models/Guild";
import User from "./models/User";
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

    await message.edit(this.title(), { embed });
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
    const requirements = await this.checkRequirements(giveaway, user);
    if (requirements.find(([, fullfilled]) => !fullfilled)) {
      // Not all requirements met
      const parts = await this.displayRequirements(requirements, guild);

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
      const [userDatabase] = await User.findOrCreate({
        where: { id: user.id },
        defaults: { id: user.id }
      });
      await GiveawayParticipant.create({
        userId: userDatabase.id,
        giveawayId: giveaway.id
      }).catch(() => {});
    }
  }

  public static async leave(user: string, giveaway: string) {
    return await GiveawayParticipant.destroy({
      where: { userId: user, giveawayId: giveaway }
    });
  }

  public static async kick(user: Discord.User, giveaway: Giveaway) {
    const guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
    if (!guild) throw new Error("Guild not on this shard!"); // TODO
    await GiveawayParticipant.destroy({
      where: {
        userId: user.id,
        giveawayId: giveaway.id
      }
    });
    await this.deleteAPIReaction(
      giveaway.channel,
      giveaway.id,
      Utils.Emojis.getRaw(Utils.Emojis.TADA),
      user.id
    );
    const requirements = await this.checkRequirements(giveaway, user);
    const parts = await this.displayRequirements(requirements, guild);
    let description =
      `You have been removed from the giveaway in **${guild?.name}** since you don't meet all requirements anymore.\n` +
      `\n` +
      parts.join(`\n`) +
      `\n` +
      `\n` +
      `After you fullfilled all requirements, you need to **react again** in <#${giveaway.channel}>.`;

    const embed: Discord.MessageEmbedOptions = {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Giveaway Requirements`,
      description,
      footer: {
        text: `You have received this message because you reacted to a giveaway in ${guild?.name}.`
      }
    };
    await user.send({ embed }).catch(() => void 0);
  }

  public static async onGuildMemberLeave(event: IGuildMemberRemoveEvent) {
    const participants = await GiveawayParticipant.findAll({
      where: {
        userId: event.d.user.id
      },
      include: [
        {
          model: Giveaway,
          where: {
            [Op.and]: [
              {
                endedAt: null,
                cancelledBy: null
              },
              Sequelize.literal(
                `(\`guildId\` >> 22) % ${OpenBump.instance.networkManager.total} = ${OpenBump.instance.networkManager.id}`
              )
            ]
          },
          include: [
            {
              model: GiveawayRequirement,
              where: {
                type: "GUILD",
                target: event.d.guild_id
              }
            }
          ]
        }
      ]
    });
    if (participants.length) {
      console.log(
        `[DEBUG] Removed member ${event.d.user.id} from guild ${event.d.guild_id}, found ${participants.length} giveaway participants matching.`
      );
      for (const participant of participants) {
        const giveaway = participant.giveaway;
        console.log(
          `[DEBUG] Member ${event.d.user.id} in guild ${event.d.guild_id} left required giveaway guild.`
        );
        const user = await OpenBump.instance.client.users.fetch(
          event.d.user.id
        );
        await Giveaways.kick(user, giveaway);
      }
    }
  }

  private static async fetchAPIMember(
    guild: string,
    member: string
  ): Promise<APIMember | null> {
    const path = `/guilds/${guild}/members/${member}`;
    const url = `https://discord.com/api${path}`;
    try {
      const [res, member]: [Response, APIMember] = await fetch(url, {
        headers: { Authorization: `Bot ${OpenBump.instance.client.token}` }
      }).then(async (res) => [res, await res.json()]);
      if (res.status !== 200) return null;
      return member;
    } catch (error) {
      return null;
    }
  }

  private static async deleteAPIReaction(
    channel: string,
    message: string,
    emoji: string,
    user: string
  ): Promise<any> {
    const path = `/channels/${channel}/messages/${message}/reactions/${encodeURIComponent(
      emoji
    )}/${user}`;
    const url = `https://discord.com/api${path}`;
    try {
      await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bot ${OpenBump.instance.client.token}` }
      });
      return true;
    } catch (error) {
      return false;
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
    await message.edit(this.title(), { embed });
    await giveaway.save();
    return giveaway;
  }

  public static async reroll(
    giveaway: string | Giveaway,
    channel: TextBasedGuildChannel
  ): Promise<Giveaway> {
    if (typeof giveaway === "string")
      giveaway = (await Giveaway.findOne({
        where: { id: giveaway }
      })) as Giveaway;
    if (!giveaway) throw new TitleError(`Error`, `Could not find giveaway.`);
    if (giveaway.guildId !== channel.guild.id)
      throw new TitleError(
        "Error",
        "The specified giveaway is not on this server."
      );

    await this.endGiveaway(giveaway, channel);

    return giveaway;
  }

  public static async startGiveaways() {
    this.startEndGiveawayLoop();
    this.editMessageLoop();
  }

  private static async startEndGiveawayLoop() {
    await this.endGiveawayLoop().catch(() => {});
    setTimeout(() => {
      this.endGiveawayLoop.bind(this);
      this.startEndGiveawayLoop();
    }, 1000 * 10);
  }

  private static async endGiveawayLoop() {
    // SELECT * FROM `Giveaway` WHERE `createdAt` <= DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL ((`time`/1000)*-1) SECOND)
    const giveaways = await Giveaway.findAll({
      where: {
        [Op.and]: [
          {
            endedAt: null,
            cancelledBy: null,
            createdAt: {
              [Op.lte]: Sequelize.fn(
                `DATE_ADD`,
                Sequelize.fn(`CURRENT_TIMESTAMP`),
                Sequelize.literal("INTERVAL ((`time`/1000)*-1) SECOND")
              )
            }
          },
          Sequelize.literal(
            `(\`guildId\` >> 22) % ${OpenBump.instance.networkManager.total} = ${OpenBump.instance.networkManager.id}`
          )
        ]
      }
    });
    for (const giveaway of giveaways) {
      await this.endGiveaway(giveaway).catch(() => {});
    }
  }

  private static async endGiveaway(
    giveaway: Giveaway,
    reroll?: TextBasedGuildChannel
  ) {
    const guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
    const winners = await GiveawayParticipant.findAll({
      where: { giveawayId: giveaway.id },
      order: [Sequelize.fn(`RAND`)],
      limit: reroll ? 1 : giveaway.winnersCount
    });
    const channel = guild?.channels.cache.get(giveaway.channel) as
      | TextBasedGuildChannel
      | undefined;
    const hostedBy =
      (await guild?.members.fetch(giveaway.createdBy).catch(() => {})) ||
      undefined;
    const message = await channel?.messages.fetch(giveaway.id);
    if (!message) {
      giveaway.cancelledBy = String(OpenBump.instance.client.user?.id);
      await giveaway.save();
      const embed: Discord.MessageEmbedOptions = {
        color: Utils.Colors.RED,
        title: `${Utils.Emojis.XMARK} Error during giveaway`,
        description:
          `The giveaway in the server **${
            guild?.name
          }** in the channel ${channel} could not be ${
            reroll ? "rerolled" : "finished"
          }. ` + `It looks like the message of the giveaway has been deleted.`,
        footer: reroll
          ? void 0
          : {
              text: `ID: ${giveaway.id}`
            }
      };
      return void (await (reroll || hostedBy)?.send({ embed }).catch(() => {}));
    }
    if (winners.length === 0) {
      giveaway.endedAt = new Date();
      await giveaway.save();
      const hostedByEmbed: Discord.MessageEmbedOptions = {
        color: Utils.Colors.ORANGE,
        title: `${Utils.Emojis.IMPORTANTNOTICE} Giveaway ${
          reroll ? "rerolled" : "ended"
        }`,
        description:
          `The giveaway in the server **${guild?.name}** has ${
            reroll ? "been rerolled" : "ended"
          } but no winner could be picked. ` +
          `**[[Message Link](${Utils.getMessageLink(
            giveaway.guildId,
            giveaway.channel,
            giveaway.id
          )})]**`,
        footer: reroll
          ? void 0
          : {
              text: `ID: ${giveaway.id}`
            }
      };
      const giveawayEmbed: Discord.MessageEmbedOptions = {
        color: Utils.Colors.ENDED,
        title: `Giveaway ended`,
        description: `No winners could be picked.`,
        footer: {
          text: `Prize: ${giveaway.prize}`
        }
      };
      try {
        await message.edit(this.title(), { embed: giveawayEmbed });
      } catch (error) {
        const embed = {
          colors: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} Error during giveaway`,
          description:
            `The giveaway in the server **${
              guild?.name
            }** in the channel ${channel} could not be ${
              reroll ? "rerolled" : "finished"
            }. ` +
            `It looks like the bot was not able to edit the giveaway message.`,
          footer: {
            text: `ID: ${giveaway.id}`
          }
        };
        return void (await (reroll || hostedBy)
          ?.send({ embed })
          .catch(() => {}));
      }
      return void (await (reroll || hostedBy)
        ?.send({ embed: hostedByEmbed })
        .catch(() => {}));
    } else {
      giveaway.endedAt = new Date();
      await giveaway.save();
      const hostedByEmbed: Discord.MessageEmbedOptions = {
        color: Utils.Colors.GREEN,
        title: `${Utils.Emojis.CHECK} Giveaway ${
          reroll ? "rerolled" : "ended"
        }`,
        description:
          `The giveaway in the server **${guild?.name}** has ${
            reroll ? "been rerolled" : "ended"
          } and ${winners.length} ${
            winners.length === 1 ? `winner has` : `winners have`
          } been drawn.\n` +
          `\n` +
          winners.map((winner) => `- <@${winner.userId}>`).join(`\n`) +
          `\n` +
          `\n` +
          `**[[Message Link](${Utils.getMessageLink(
            giveaway.guildId,
            giveaway.channel,
            giveaway.id
          )})]**`,
        footer: {
          text: `ID: ${giveaway.id}`
        }
      };
      const winnerEmbed: Discord.MessageEmbedOptions = {
        color: Utils.Colors.GREEN,
        title: `${Utils.Emojis.TADA} You won a giveaway!`,
        description:
          `Congratulations! You won the **${giveaway.prize}** in the server **${guild?.name}**.\n` +
          `\n` +
          `**[[Message Link](${Utils.getMessageLink(
            giveaway.guildId,
            giveaway.channel,
            giveaway.id
          )})]**`
      };
      const giveawayEmbed: Discord.MessageEmbedOptions = {
        color: Utils.Colors.ENDED,
        title: `Giveaway ended`,
        description: `**Winners:** ${winners
          .map((winner) => `<@${winner.userId}>`)
          .join(" ")}`,
        footer: {
          text: `Prize: ${giveaway.prize}`
        }
      };
      try {
        await message.edit(this.title(), { embed: giveawayEmbed });
        await channel?.send(
          `${Utils.Emojis.TADA} **Giveaway ${
            reroll ? "rerolled" : "ended"
          }!** ${Utils.Emojis.TADA}\n` +
            `Congratulations ${winners
              .map((winner) => `<@${winner.userId}>`)
              .join(" ")}! You won the **${giveaway.prize}**.`,
          { allowedMentions: { users: winners.map((winner) => winner.userId) } }
        );
      } catch (error) {
        const embed = {
          colors: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} Error during giveaway`,
          description:
            `The giveaway in the server **${
              guild?.name
            }** in the channel ${channel} could not be ${
              reroll ? "rerolled" : "finished"
            }. ` +
            `It looks like the bot was not able to edit the giveaway message or post the winner messages.`,
          footer: {
            text: `ID: ${giveaway.id}`
          }
        };
        return void (await (reroll || hostedBy)
          ?.send({ embed })
          .catch(() => {}));
      }
      await (reroll || hostedBy)
        ?.send({ embed: hostedByEmbed })
        .catch(() => {});
      for (const winner of winners) {
        const user =
          (await OpenBump.instance.client.users
            .fetch(winner.userId)
            .catch(() => {})) || undefined;
        await user?.send({ embed: winnerEmbed }).catch(() => {});
      }
    }
  }

  private static async editMessageLoop() {
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

      await message.edit(this.title(), { embed }).catch(() => {});
    }
  }

  private static title() {
    return `${Utils.Emojis.TADA} **GIVEAWAY** ${Utils.Emojis.TADA}`;
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
            `Must join: **[${requirementGuildDatabase?.name}](https://discord.gg/${requirement.invite})**`
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

  public static async checkRequirements(
    giveaway: Giveaway,
    user: Discord.User
  ) {
    let requirements: Array<[GiveawayRequirement, boolean]> = [];
    for (const requirement of giveaway.requirements) {
      if (requirement.type === "GUILD") {
        const member = await this.fetchAPIMember(
          String(requirement.target),
          user.id
        );
        requirements.push([requirement, Boolean(member)]);
      } else if (requirement.type === "ROLE") {
        const member = await this.fetchAPIMember(giveaway.guildId, user.id);
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
    return requirements;
  }

  public static async displayRequirements(
    requirements: Array<[GiveawayRequirement, boolean]>,
    guild: Discord.Guild
  ) {
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
          }** **[[Invite](https://discord.gg/${requirement.invite})**]`
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
          }** **[[Vote](${Utils.Lists.getLinkTopGG()})]**`
        );
      }
    }

    return parts;
  }
}
