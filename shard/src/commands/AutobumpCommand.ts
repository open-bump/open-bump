import { SuccessfulParsedMessage } from "discord-command-parser";
import { EmbedFieldData } from "discord.js";
import ms from "ms";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage, RestrictedFeatureError } from "../Utils";

export default class AutobumpCommand extends Command {
  public name = "autobump";
  public aliases = [
    "setautobump",
    "set-autobump",
    "toggleautobump",
    "toggle-autobump"
  ];
  public syntax = "autobump [enable|disable|notifications [channel|reset]]";
  public description = "Enable and disable autobump";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, member, guild } = message;

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (!guildDatabase.getFeatures().includes(Utils.Feature.AUTOBUMP))
      throw new RestrictedFeatureError(Utils.Feature.AUTOBUMP, guildDatabase);

    const { autobump, autobumpNotifications } = guildDatabase;

    const suggestions: Array<EmbedFieldData> = [];
    if (!autobumpNotifications)
      suggestions.push({
        name: `${Utils.Emojis.BELL} Suggestion: Autobump Notifications`,
        value:
          "Autobump notifications will send a message in a selected channel every time your server is autobumped. " +
          `This allows you to keep better track of autobump.\n` +
          `\n` +
          `Use \`${Utils.getPrefix(
            guildDatabase
          )}autobump notifications <channel>\` to set a channel.`
      });

    const syntax: Array<EmbedFieldData> = [
      {
        name: "Syntax",
        value: `${Utils.getPrefix(guildDatabase)}${this.syntax}`
      }
    ];

    if (args.length >= 1) {
      if (
        args.length === 1 &&
        (args[0] === "enable" || args[0] === "on" || args[0] === "true")
      ) {
        guildDatabase.autobump = true;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Autobump has been enabled`,
          description: `Your server will now automatically be bumped every ${ms(
            guildDatabase.getCooldown(true),
            { long: true }
          )}.`,
          fields: suggestions
        };
        return void (await channel.send({ embed }));
      } else if (
        args.length === 1 &&
        (args[0] === "disable" || args[0] === "off" || args[0] === "false")
      ) {
        guildDatabase.autobump = false;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Autobump has been disabled`,
          description: `You'll now have to manually bump your server again.`
        };
        return void (await channel.send({ embed }));
      } else if (
        args[0] === "notifications" ||
        args[0] == "notification" ||
        args[0] === "notify"
      ) {
        if (args.length === 1) {
          const notificationChannel = guild.channels.cache.get(
            guildDatabase.autobumpNotifications || ""
          );

          const embed = {
            color: Utils.Colors.BLUE,
            title: `${Utils.Emojis.INFORMATION} Autobump Notifications`,
            description:
              `__**Current Notifications Channel:**__ ${
                notificationChannel || "*No Channel*"
              }.\n` +
              `\n` +
              `With autobump notifications, ${this.instance.client.user?.username} will send a message in the specified channel ` +
              `every time your server was autobumped. This allows you to keep track of when autobump is run.\n` +
              `You can ${
                notificationChannel ? "disable" : "enable"
              } autobump notifications by running the command \`${Utils.getPrefix(
                guildDatabase
              )}autobump notifications ${
                notificationChannel ? "reset" : "<channel>"
              }\`.`
          };
          return void (await channel.send({ embed }));
        } else if (args.length === 2) {
          if (!(args[1] === "reset" || args[1] === "default")) {
            const newChannel = Utils.findChannel(args[1], guild);

            const issues = Utils.Bump.getAutobumpNotificationChannelIssues(
              newChannel
            );
            if (issues.length) {
              const embed = {
                color: Utils.Colors.RED,
                title: `${Utils.Emojis.XMARK} Can't use that channel`,
                description:
                  `**Please fix these issues before using ${newChannel}:**\n` +
                  issues.map((issue) => `- ${issue}`).join("\n")
              };
              return void (await channel.send({ embed }));
            }

            guildDatabase.autobumpNotifications = newChannel.id;
            await guildDatabase.save();

            const embed = {
              color: Utils.Colors.GREEN,
              title: `${Utils.Emojis.CHECK} Notifications channel has been updated`,
              description: `__**New Notifications Channel:**__ ${newChannel}`
            };
            return void (await channel.send({ embed }));
          } else {
            guildDatabase.autobumpNotifications = null;
            await guildDatabase.save();

            const embed = {
              color: Utils.Colors.GREEN,
              title: `${Utils.Emojis.CHECK} Notifications channel has been updated`,
              description: `__**New Notifications Channel:**__ *No Channel*`
            };
            return void (await channel.send({ embed }));
          }
        } else return void (await this.sendSyntax(message, guildDatabase));
      } else return void (await this.sendSyntax(message, guildDatabase));
    } else {
      const embed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.INFORMATION} Autobump`,
        description:
          `__**Current Autobump Status:**__ ${
            autobump ? "Enabled" : "Disabled"
          }.\n` +
          `\n` +
          `With Autobump, ${
            this.instance.client.user?.username
          } will automatically bump your server every ${ms(
            guildDatabase.getCooldown(true),
            { long: true }
          )}.\n` +
          `You can ${
            autobump ? "disable" : "enable"
          } Autobump by running the command \`${Utils.getPrefix(
            guildDatabase
          )}autobump ${autobump ? "disable" : "enable"}\`.`,
        fields: autobump ? (suggestions.length ? suggestions : syntax) : []
      };
      return void (await channel.send({ embed }));
    }
  }
}
