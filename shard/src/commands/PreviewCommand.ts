import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class PreviewCommand extends Command {
  public name = "preview";
  public aliases = ["showcase"];
  public syntax = "preview";
  public description = "Display a preview of your bump's embed";
  public general = false;

  public async run(
    { message }: ParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, guild, author } = message;
    const embed = await Utils.Bump.getEmbed(guild, guildDatabase, author.id);
    return void (await channel.send({ embed }));
  }
}
