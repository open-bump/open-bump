import { SuccessfulParsedMessage } from "discord-command-parser";
import Command from "../Command";
import CommandManager from "../CommandManager";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class PreviewCommand extends Command {
  public name = "preview";
  public aliases = ["showcase"];
  public syntax = "preview";
  public description = "Display a preview of your bump's embed";
  public category = CommandManager.Categories.BUMPSET;

  public async run(
    { message }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, guild, author } = message;
    const embed = await Utils.Bump.getEmbed(
      guild,
      guildDatabase,
      author.id,
      true
    );
    return void (await channel.send({ embed }));
  }
}
