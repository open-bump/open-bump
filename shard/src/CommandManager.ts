import parser from "discord-command-parser";
import Discord from "discord.js";
import Command from "./Command";
import AboutCommand from "./commands/AboutCommand";
import AutobumpCommand from "./commands/AutobumpCommand";
import BumpCommand from "./commands/BumpCommand";
import HelpCommand from "./commands/HelpCommand";
import NsfwCommand from "./commands/NsfwCommand";
import PingCommand from "./commands/PingCommand";
import PrefixCommand from "./commands/PrefixCommand";
import PremiumCommand from "./commands/PremiumCommand";
import PreviewCommand from "./commands/PreviewCommand";
import SetBannerCommand from "./commands/SetBannerCommand";
import SetChannelCommand from "./commands/SetChannelCommand";
import SetColorCommand from "./commands/SetColorCommand";
import SetDescriptionCommand from "./commands/SetDescriptionCommand";
import SetInviteCommand from "./commands/SetInviteCommand";
import config from "./config";
import OpenBump from "./OpenBump";
import Utils from "./Utils";
import StatsCommand from "./commands/StatsCommand";

export default class CommandManager {
  private commands: { [name: string]: Command } = {};

  constructor(private instance: OpenBump) {
    this.registerCommands();
  }

  public async run(message: Discord.Message) {
    if (!message.author || message.author.bot || !message.guild) return;

    const prefixes = [
      config.settings.prefix,
      String(this.instance.client.user)
    ];
    const guildDatabase = await Utils.ensureGuild(message.guild);
    if (guildDatabase.getFeatures().includes(Utils.Feature.PREFIX))
      if (guildDatabase.prefix) prefixes.push(guildDatabase.prefix);

    const parsed = parser.parse(message, prefixes, {});
    if (parsed.success) {
      const command = this.getCommand(parsed.command);
      if (!command) return;

      try {
        await command.run(parsed, guildDatabase);
      } catch (error) {
        const embed = Utils.errorToEmbed(error);
        await message.channel.send({ embed });
        console.error(`Catched error while command execution!`, error);
      }
    }
  }

  private registerCommands() {
    this.registerCommand(new HelpCommand(this.instance));
    this.registerCommand(new PingCommand(this.instance));
    this.registerCommand(new StatsCommand(this.instance));
    this.registerCommand(new PrefixCommand(this.instance));
    this.registerCommand(new PremiumCommand(this.instance));
    this.registerCommand(new BumpCommand(this.instance));
    this.registerCommand(new AboutCommand(this.instance));
    this.registerCommand(new AutobumpCommand(this.instance));
    this.registerCommand(new NsfwCommand(this.instance));
    this.registerCommand(new SetBannerCommand(this.instance));
    this.registerCommand(new SetChannelCommand(this.instance));
    this.registerCommand(new SetColorCommand(this.instance));
    this.registerCommand(new SetDescriptionCommand(this.instance));
    this.registerCommand(new SetInviteCommand(this.instance));
    this.registerCommand(new PreviewCommand(this.instance));
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

  public getCommands() {
    return Object.values(this.commands);
  }
}
