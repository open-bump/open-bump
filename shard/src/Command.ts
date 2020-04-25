import { ParsedMessage } from "discord-command-parser";
import Discord from "discord.js";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";
import Utils from "./Utils";

export default abstract class Command {
  public abstract name: string;
  public aliases: Array<string> = [];
  public abstract syntax: string;
  public abstract description: string;
  public vanished = false;
  private permissions: Discord.PermissionResolvable = [
    Discord.Permissions.FLAGS.SEND_MESSAGES,
    Discord.Permissions.FLAGS.VIEW_CHANNEL,
    Discord.Permissions.FLAGS.EMBED_LINKS
  ];

  constructor(
    protected instance: OpenBump,
    permissions?: Discord.PermissionResolvable
  ) {
    if (permissions)
      this.permissions =
        new Discord.Permissions(this.permissions).bitfield |
        new Discord.Permissions(permissions).bitfield;
  }

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

  protected async sendSyntax(
    message: Discord.Message,
    guild: Guild,
    syntax?: string
  ) {
    const embed = {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Syntax Error`,
      description: `**Syntax:** ${Utils.getPrefix(guild)}${
        syntax || this.syntax
      }`
    };
    return void (await message.channel.send({ embed }));
  }
}
