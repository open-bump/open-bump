import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";

export default class HelpCommand extends Command {
  public name = "help";
  public syntax = "help";
  public description = "View a list of available commands";

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel } = message;
    await channel.send("Help");
  }
}
