import { ParsedMessage } from "discord-command-parser";
import Discord from "discord.js";
import ms from "ms";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import Command from "../Command";
import config from "../config";
import BumpData from "../models/BumpData";
import Guild from "../models/Guild";
import OpenBump from "../OpenBump";
import Utils, { EmbedError } from "../Utils";

export default class BumpCommand extends Command {
  public name = "bump";
  public syntax = "bump";
  public description = "Bump your server";
  public general = false;

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel, guild, author } = message;

    if (
      !guildDatabase.getFeatures().includes("AUTOBUMP") ||
      !guildDatabase.autobump
    ) {
      const voted = await Utils.Lists.hasVotedTopGG(author.id);
      const cooldown = guildDatabase.getCooldown(true, voted);
      const nextBump = guildDatabase.lastBumpedAt
        ? guildDatabase.lastBumpedAt.valueOf() + cooldown
        : 0;
      const remaining = nextBump - Date.now();
      if (nextBump && nextBump > Date.now()) {
        const suggestions: Array<Discord.EmbedFieldData> = [];

        const voteCooldown = guildDatabase.getCooldown(true, true);
        if (
          !guildDatabase.feed &&
          guildDatabase.getCooldown() > config.settings.cooldown.min &&
          Utils.randomInt(2) === 0
        )
          suggestions.push({
            name: `${Utils.Emojis.BELL} Suggestion: Bump Channel`,
            value:
              `You don't want to wait ${ms(cooldown, {
                long: true
              })} until you can bump? You can reduce your cooldown by seting your guild a bump channel!\n` +
              `To set a bump channel, please use the command \`${Utils.getPrefix(
                guildDatabase
              )}setchannel <channel>\`.`
          });
        else if (
          !voted &&
          guildDatabase.getCooldown() > config.settings.cooldown.min &&
          cooldown > voteCooldown &&
          Utils.randomInt(3) === 0
        )
          suggestions.push({
            name: `${Utils.Emojis.BELL} Suggestion: Vote`,
            value:
              `You don't want to wait ${ms(cooldown, {
                long: true
              })} until you can bump? Vote for our bot!\n` +
              `You can vote at https://top.gg/bot/${OpenBump.instance.client.user?.id}/vote. ` +
              `It will decrease your cooldown by ${ms(cooldown - voteCooldown, {
                long: true
              })} for 12 hours.`
          });
        else if (!guildDatabase.isPremium() && Utils.randomInt(3) === 0)
          suggestions.push({
            name: `${Utils.Emojis.BELL} Suggestion: Premium`,
            value:
              `You don't want to wait ${ms(cooldown, {
                long: true
              })} until you can bump? Upgrade to premium!\n` +
              `To view more information about premium, use the command \`ob!premium\`.`
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

      const loadingEmbed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.LOADING} Your server is being bumped...`
      };
      const loadingMessage = await channel.send({
        embed: loadingEmbed
      });

      // TODO: Use correct bump utils function to regulate receivers
      let bumpEmbed;

      try {
        bumpEmbed = await Utils.Bump.getEmbed(guild, guildDatabase);
      } catch (error) {
        if (error instanceof EmbedError) {
          return void (await loadingMessage.edit({
            embed: error.toEmbed()
          }));
        } else throw error;
      }

      let { amount, featured } = await Utils.Bump.bump(
        guildDatabase,
        bumpEmbed
      );

      const featuredGuildDatabases = featured.length
        ? await Guild.findAll({
            where: {
              id: {
                [Op.in]: featured.map(({ id }) => id)
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

      let description =
        `Your server has been bumped to ${amount} servers.\n` +
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
        description
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
