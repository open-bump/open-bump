import { ParsedMessage } from "discord-command-parser";
import Discord from "discord.js";
import Guild from "./models/Guild";
import Utils from "./Utils";

export default abstract class Command {
  public abstract name: string;
  public aliases: Array<string> = [];
  public abstract syntax: string;
  public abstract description: string;
  protected permissions = [];

  public abstract async run(
    parsed: ParsedMessage,
    guildDatabase: Guild
  ): Promise<void>;

  public async calculatePermissions(
    parsed: ParsedMessage,
    guildDatabase: Guild
  ): Promise<Discord.PermissionResolvable> {
    return this.permissions;
  }

  protected async sendSyntax(message: Discord.Message, syntax?: string) {
    const embed = {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Syntax Error`,
      description: `**Syntax:** ${syntax || this.syntax}`
    };
    return void (await message.channel.send({ embed }));
  }
}
