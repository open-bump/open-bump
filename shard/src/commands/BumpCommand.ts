import { ParsedMessage } from "discord-command-parser";
import ms from "ms";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { EmbedError } from "../Utils";

export default class BumpCommand extends Command {
  public name = "bump";
  public syntax = "bump";
  public description = "Bump your server";

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel, guild, author } = message;

    if (
      !guildDatabase.getFeatures().includes("AUTOBUMP") ||
      !guildDatabase.autobump
    ) {
      const cooldown = guildDatabase.getCooldown(true);
      const nextBump = guildDatabase.lastBumpedAt?.valueOf() + cooldown;
      const remaining = nextBump - Date.now();
      if (nextBump && nextBump > Date.now()) {
        // TODO: Suggestions
        const embed = {
          color: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} You are on cooldown!`,
          description:
            `**Total Cooldown:** ${ms(cooldown, { long: true })}\n` +
            `**Next Bump:** In ${ms(remaining, { long: true })}`
        };
        return void (await channel.send({ embed }));
      }
      const loadingEmbed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.LOADING} Your server is being bumped...`
      };
      const loadingMessage = await channel.send({ embed: loadingEmbed });

      // TODO: Use correct bump utils function to regulate receivers
      let bumpEmbed;

      try {
        bumpEmbed = await Utils.Bump.getEmbed(guild, guildDatabase);
      } catch (error) {
        if (error instanceof EmbedError) {
          return void (await loadingMessage.edit({ embed: error.toEmbed() }));
        } else throw error;
      }

      const amount = await Utils.Bump.bump(guildDatabase, bumpEmbed);

      guildDatabase.lastBumpedAt = new Date();
      guildDatabase.lastBumpedBy = author.id;
      guildDatabase.totalBumps++;
      await guildDatabase.save();

      // TODO: Remove server count
      const successEmbed = {
        color: Utils.Colors.GREEN,
        title: `${Utils.Emojis.CHECK} Success`,
        description: `Your server has been bumped to ${amount} servers.`
      };
      await loadingMessage.edit({ embed: successEmbed });
    } else {
      const embed = {
        color: Utils.Colors.ORANGE,
        title: `${Utils.Emojis.IMPORTANTNOTICE} Autobump Enabled`,
        description:
          `You can't manually bump your server because you have autobump enabled.\n` +
          `As long as you have autobump enabled, the bot automatically bumps your server every ${ms(
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
