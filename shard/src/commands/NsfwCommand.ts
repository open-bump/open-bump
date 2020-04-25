import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class NsfwCommand extends Command {
  public name = "nsfw";
  public aliases = ["setnsfw", "set-nsfw", "togglensfw", "toggle-nsfw"];
  public syntax = "nsfw [enable|disable]";
  public description = "Set whether your server is NSFW or not";
  public general = false;

  public async run(
    { message, arguments: args }: ParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, member } = message;

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (args.length === 1) {
      if (args[0] === "enable" || args[0] === "on" || args[0] === "true") {
        guildDatabase.nsfw = true;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} NSFW status has been updated`,
          description: `__**New NSFW Status:**__ Enabled`
        };
        return void (await channel.send({ embed }));
      } else if (
        args[0] === "disable" ||
        args[0] === "off" ||
        args[0] === "false"
      ) {
        guildDatabase.nsfw = false;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} NSFW status has been updated`,
          description: `__**New NSFW Status:**__ Disabled`
        };
        return void (await channel.send({ embed }));
      } else return void (await this.sendSyntax(message, guildDatabase));
    } else {
      const { nsfw } = guildDatabase;
      const embed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.INFORMATION} Mark a server as NSFW`,
        description:
          `__**Current NSFW Status:**__ ${
            nsfw ? "**NSFW**" : "**Not NSFW**"
          }.\n` +
          `\n` +
          `All servers that contain NSFW content have to be marked as NSFW servers. These servers only are bumped to other NSFW servers, and only receive other NSFW servers.\n` +
          `\n` +
          `You can ${
            nsfw ? "disable" : "enable"
          } NSFW marking by running the command \`${Utils.getPrefix(
            guildDatabase
          )}nsfw ${nsfw ? "disable" : "enable"}\`.`
      };
      return void (await channel.send({ embed }));
    }
  }
}
