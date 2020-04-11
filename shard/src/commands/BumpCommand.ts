import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils from "../Utils";

export default class BumpCommand extends Command {
  public name = "bump";
  public syntax = "bump";
  public description = "Bump your server";

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel, guild } = message;

    await channel.send("test...");

    const embed = await Utils.Bump.getEmbed(guild, guildDatabase);
    const amount = await Utils.Bump.bumpToAllShards(guildDatabase, embed);

    await channel.send(`bumped: ${amount}`);
  }
}
