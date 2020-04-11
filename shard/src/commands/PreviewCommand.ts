import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils from "../Utils";

export default class PreviewCommand extends Command {
  public name = "preview";
  public aliases = ["showcase"];
  public syntax = "preview";
  public description = "Display a preview of your bump's embed";

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel, guild } = message;
    let embed;
    try {
      embed = await Utils.Bump.getEmbed(guild, guildDatabase);
    } catch (error) {
      const embed = Utils.errorToEmbed(error);
      return void (await channel.send({ embed }));
    }
    return void (await channel.send({ embed }));
  }
}
