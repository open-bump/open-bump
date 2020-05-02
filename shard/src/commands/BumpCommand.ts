import { ParsedMessage } from "discord-command-parser";
import Discord from "discord.js";
import ms from "ms";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import Command from "../Command";
import CommandManager from "../CommandManager";
import config from "../config";
import BumpData from "../models/BumpData";
import Guild from "../models/Guild";
import Utils, { EmbedError, GuildMessage } from "../Utils";

export default class BumpCommand extends Command {
  public name = "bump";
  public syntax = "bump";
  public description = "Bump your server";
  public category = CommandManager.Categories.BUMPSET;

  public async run(
    { message }: ParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, guild, author } = message;

    if (
      !guildDatabase.getFeatures().includes("AUTOBUMP") ||
      !guildDatabase.autobump
    ) {
      const votingEnabled = config.lists.topgg.enabled;
      const voted = await Utils.Lists.hasVotedTopGG(author.id);
      const voteCooldown = guildDatabase.getCooldown(true, true);
      const cooldown = guildDatabase.getCooldown(true, voted);
      const maxedOut =
        guildDatabase.getCooldown(false, voted) <= config.settings.cooldown.min;
      const nextBump = guildDatabase.lastBumpedAt
        ? guildDatabase.lastBumpedAt.valueOf() + cooldown
        : 0;
      const remaining = nextBump - Date.now();
      if (nextBump && nextBump > Date.now()) {
        const suggestions: Array<Discord.EmbedFieldData> = [];

        if (!guildDatabase.feed && !maxedOut && Utils.randomInt(2) === 0)
          suggestions.push({
            name: `${Utils.Emojis.BELL} Suggestion: Bump Channel`,
            value:
              `You don't want to wait ${ms(cooldown, {
                long: true
              })} until you can bump? Set your guild a bump channel!\n` +
              `To set a bump channel, please use the command \`${Utils.getPrefix(
                guildDatabase
              )}setchannel <channel>\`.`
          });
        else if (
          votingEnabled &&
          !voted &&
          !maxedOut &&
          cooldown > voteCooldown &&
          (Utils.Lists.isWeekendTopGG() || Utils.randomInt(3) === 0)
        )
          suggestions.push({
            name: `${Utils.Emojis.BELL} Suggestion: Vote`,
            value:
              `You don't want to wait ${ms(cooldown, {
                long: true
              })} until you can bump? **[Vote for ${
                this.instance.client.user?.username
              }!](${Utils.Lists.getLinkTopGG()})**\n` +
              `It will decrease your cooldown by ${ms(cooldown - voteCooldown, {
                long: true
              })} for the next 12 hours.`
          });
        else if (!guildDatabase.isPremium() && Utils.randomInt(3) === 0)
          suggestions.push({
            name: `${Utils.Emojis.BELL} Suggestion: Premium`,
            value:
              `You don't want to wait ${ms(cooldown, {
                long: true
              })} until you can bump? Upgrade to premium!\n` +
              `To view more information about premium, use the command \`${Utils.getPrefix(
                guildDatabase
              )}premium\`.`
          });

        const embed = {
          color: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} You are on cooldown!`,
          description:
            `**Total Cooldown:** ${ms(cooldown, {
              long: true
            })}\n` + `**Next Bump:** In ${ms(remaining, { long: true })}`,
          fields: suggestions
        };
        return void (await channel.send({ embed }));
      }

      guildDatabase.lastBumpedAt = new Date();
      guildDatabase.lastBumpedBy = author.id;
      guildDatabase.totalBumps++;
      await guildDatabase.save();

      const loadingEmbedEmbed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.LOADING} Building your server's bump message... [1/2]`
      };
      const loadingMessage = await channel.send({ embed: loadingEmbedEmbed });

      // TODO: Use correct bump utils function to regulate receivers
      let bumpEmbed;

      try {
        bumpEmbed = await Utils.Bump.getEmbed(guild, guildDatabase, author.id);
      } catch (error) {
        if (error instanceof EmbedError) {
          guildDatabase.lastBumpedAt = null;
          await guildDatabase.save();
          return void (await loadingMessage.edit({
            embed: error.toEmbed()
          }));
        } else throw error;
      }

      const loadingBumpEmbed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.LOADING} Pushing your server's bump message to other servers... [2/2]`
      };
      await loadingMessage.edit({ embed: loadingBumpEmbed });

      let { amount, featured } = await Utils.Bump.bump(
        guildDatabase,
        bumpEmbed
      );

      const featuredGuildDatabases = featured.length
        ? await Guild.findAll({
            where: {
              id: {
                [Op.in]: featured.map(({ id }) => id)
              },
              name: {
                [Op.and]: [
                  {
                    [Op.ne]: null
                  },
                  {
                    [Op.ne]: ""
                  }
                ]
              }
            },
            include: [
              {
                model: BumpData,
                where: {
                  invite: {
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
              }
            ],
            order: [["hub", "DESC"], Sequelize.literal("rand()")],
            limit: 3
          })
        : [];

      console.log(
        `Guild ${guild.name} (${guild.id}) has been successfully bumped to ${amount} servers.`
      );

      let description =
        `Your server has been successfully bumped.\n` +
        `You can bump again in ${ms(cooldown, {
          long: true
        })}.`;

      if (featuredGuildDatabases.length) {
        description +=
          `\n\n` +
          `**Featured servers your server was bumped to:**\n` +
          Utils.niceList(
            featuredGuildDatabases.map(
              (guild) =>
                `**[${guild.name}](https://discord.gg/${guild.bumpData.invite})**`
            )
          );
      }

      // TODO: Remove server count
      const successEmbed = {
        color: Utils.Colors.GREEN,
        title: `${Utils.Emojis.CHECK} Success`,
        description,
        fields: [
          {
            name: `${Utils.Emojis.BELL} Next Bump`,
            value: `You can bump again in ${ms(cooldown, {
              long: true
            })}.${
              votingEnabled && !voted && !maxedOut && cooldown > voteCooldown
                ? `\n` +
                  `**[Vote for ${
                    this.instance.client.user?.username
                  }](${Utils.Lists.getLinkTopGG()})** to reduce your cooldown by ${ms(
                    cooldown - voteCooldown,
                    {
                      long: true
                    }
                  )} for the next 12 hours!`
                : ""
            }`
          }
        ]
      };
      await loadingMessage.edit({ embed: successEmbed });
    } else {
      const embed = {
        color: Utils.Colors.ORANGE,
        title: `${Utils.Emojis.IMPORTANTNOTICE} Autobump Enabled`,
        description:
          `You can't manually bump your server because you have autobump enabled.\n` +
          `As long as you have autobump enabled, ${
            this.instance.client.user?.username
          } automatically bumps your server every ${ms(
            guildDatabase.getCooldown(true),
            { long: true }
          )}.` +
          (guildDatabase.lastBumpedAt && guildDatabase.lastBumpedBy
            ? `\n\n` +
              `**Last bumped at:** ${ms(
                Date.now() - guildDatabase.lastBumpedAt.valueOf(),
                { long: true }
              )} ago\n` +
              `**Last bumped by:** <@${guildDatabase.lastBumpedBy}>`
            : "")
      };
      return void (await channel.send({ embed }));
    }
  }
}
