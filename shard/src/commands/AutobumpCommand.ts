import { SuccessfulParsedMessage } from "discord-command-parser";
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
  public syntax = "autobump [enable|disable]";
  public description = "Enable and disable autobump";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, member } = message;

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (!guildDatabase.getFeatures().includes(Utils.Feature.AUTOBUMP))
      throw new RestrictedFeatureError(Utils.Feature.AUTOBUMP, guildDatabase);

    if (args.length === 1) {
      if (args[0] === "enable" || args[0] === "on" || args[0] === "true") {
        guildDatabase.autobump = true;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Autobump has been enabled`,
          description: `Your server will now automatically be bumped every ${ms(
            guildDatabase.getCooldown(true),
            { long: true }
          )}.`
        };
        return void (await channel.send({ embed }));
      } else if (
        args[0] === "disable" ||
        args[0] === "off" ||
        args[0] === "false"
      ) {
        guildDatabase.autobump = false;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Autobump has been disabled`,
          description: `You'll now have to manually bump your server again.`
        };
        return void (await channel.send({ embed }));
      } else return void (await this.sendSyntax(message, guildDatabase));
    } else {
      const { autobump } = guildDatabase;
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
          )}autobump ${autobump ? "disable" : "enable"}\`.`
      };
      return void (await channel.send({ embed }));
    }
  }
}
