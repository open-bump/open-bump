import Command from "../Command";
import { ParsedMessage } from "discord-command-parser";

export default class HelpCommand extends Command {
  public name = "help";
  public description = "";

  public async run({ message }: ParsedMessage) {
    const { channel } = message;
    await channel.send("Help");
  }
}
