import parser from "discord-command-parser";
import Discord from "discord.js";
import Command from "./Command";
import HelpCommand from "./commands/HelpCommand";
import config from "./config";
import Utils from "./Utils";

export default class CommandManager {
  private commands: { [name: string]: Command } = {};

  constructor() {
    this.registerCommands();
  }

  public async run(message: Discord.Message) {
    if (!message.author || message.author.bot || !message.guild) return;

    const guildDatabase = await Utils.ensureGuild(message.guild);
    console.log("guildDatabase", JSON.stringify(guildDatabase, undefined, 2));

    const parsed = parser.parse(message, config.settings.prefix, {});
    if (parsed.success) {
      const command = this.getCommand(parsed.command);
      if (!command) return;

      await command.run(parsed);
    }
  }

  private registerCommands() {
    this.registerCommand(new HelpCommand());
  }

  private registerCommand(command: Command) {
    this.commands[command.name.toLowerCase()] = command;
  }

  public getCommand(name: string) {
    let command: Command | undefined = this.commands[name.toLowerCase()];
    if (command) return command;
    command = Object.values(this.commands).find((command) =>
      command.aliases?.includes(name.toLowerCase())
    );
    return command;
  }
}
