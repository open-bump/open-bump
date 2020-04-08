import Discord from "discord.js";
import Command from "./Command";
import parser from "discord-command-parser";
import HelpCommand from "./commands/HelpCommand";

export default class CommandManager {
  private commands: { [name: string]: Command } = {};

  constructor() {
    this.registerCommands();
  }

  public async run(message: Discord.Message) {
    // TODO: Handle command
  }

  private registerCommands() {
    this.registerCommand(new HelpCommand());
  }

  private registerCommand(command: Command) {
    this.commands[command.name.toLowerCase()] = command;
  }
}
