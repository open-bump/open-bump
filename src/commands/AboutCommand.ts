import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import config from "../config";
import Guild from "../models/Guild";
import OpenBump from "../OpenBump";
import Utils from "../Utils";

export default class AboutCommand extends Command {
  public name = "about";
  public aliases = ["invite", "info", "information"];
  public syntax = "about";
  public description = "View information about this bot";

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel } = message;
    const packageJson = Utils.getPackageJson();
    const embed = {
      color: Utils.Colors.BLUE,
      title: `${Utils.Emojis.INFORMATION} About ${OpenBump.instance.client.user.username}`,
      description:
        `**Version:** ${packageJson.version}\n` +
        `**Author:** ${packageJson.author}\n` +
        `**Description:** ${packageJson.description}\n` +
        `**Invite this bot:** [Click Here](${Utils.getInviteLink()})\n` +
        `**Support Server:** [Click Here](${config.settings.support})`
    };
    return void (await channel.send({ embed }));
  }
}
