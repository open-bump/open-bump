import * as parser from "discord-command-parser";
import Discord from "discord.js";
import Command from "./Command";
import AboutCommand from "./commands/AboutCommand";
import AutobumpCommand from "./commands/AutobumpCommand";
import BrandingCommand from "./commands/BrandingCommand";
import BumpCommand from "./commands/BumpCommand";
import HelpCommand from "./commands/HelpCommand";
import InviteCommand from "./commands/InviteCommand";
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
import StatsCommand from "./commands/StatsCommand";
import SupportCommand from "./commands/SupportCommand";
import VoteCommand from "./commands/VoteCommand";
import config from "./config";
import OpenBump from "./OpenBump";
import Utils, { EmbedError, GuildMessage } from "./Utils";

export default class CommandManager {
  public static Categories = {
    GENERAL: "GENERAL" as "GENERAL",
    BUMPSET: "BUMPSET" as "BUMPSET",
    PREMIUM: "PREMIUM" as "PREMIUM"
  };

  private commands: { [name: string]: Command } = {};

  constructor(private instance: OpenBump) {
    this.registerCommands();
  }

  public async run(message: GuildMessage) {
    if (
      !message.author ||
      message.author.bot ||
      !message.guild ||
      !message.channel ||
      !(message.channel instanceof Discord.TextChannel)
    )
      return;

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

      const channel: Discord.TextChannel = parsed.message
        .channel as Discord.TextChannel;
      const requiredPermissions = new Discord.Permissions(
        await command.calculatePermissions(parsed, guildDatabase)
      );
      const channelPermissions =
        channel.permissionsFor(String(OpenBump.instance.client.user?.id)) ||
        new Discord.Permissions(0);
      const missing =
        requiredPermissions.bitfield & ~channelPermissions.bitfield;
      if (missing) {
        if (
          channelPermissions?.has([
            Discord.Permissions.FLAGS.SEND_MESSAGES,
            Discord.Permissions.FLAGS.EMBED_LINKS
          ])
        ) {
          // Send permissions error
          const embed = {
            color: Utils.Colors.RED,
            title: `${Utils.Emojis.XMARK} Permissions Error`,
            description:
              `Make sure the bot has the following permissions in this channel:\n` +
              Utils.getPermissionIdentifiers(missing)
                .map(Utils.translatePermission)
                .map((permission) => `- \`${permission}\``)
                .join("\n")
          };
          return void (await channel.send({ embed }));
        } else if (
          channelPermissions?.has([Discord.Permissions.FLAGS.SEND_MESSAGES])
        ) {
          // Send permissions error in plain text
          return void (await channel.send(
            "**Permissions Error!**\n" +
              "Grant this bot `Send Messages` and `Embed Links` to view more information."
          ));
        } else {
          return void console.log("TODO");
          // Send DM as the bot doesn't have enough permissions
        }
      }

      try {
        await command.run(parsed, guildDatabase);
      } catch (error) {
        const embed = Utils.errorToEmbed(error);
        await message.channel.send({ embed });
        if (!(error instanceof EmbedError))
          console.error(`Catched error while command execution!`, error);
      }
    }
  }

  private registerCommands() {
    this.registerCommand(new HelpCommand(this.instance));
    this.registerCommand(new PingCommand(this.instance));
    this.registerCommand(new StatsCommand(this.instance));
    this.registerCommand(new BrandingCommand(this.instance));
    this.registerCommand(new PrefixCommand(this.instance));
    this.registerCommand(new PremiumCommand(this.instance));
    this.registerCommand(new BumpCommand(this.instance));
    this.registerCommand(new AboutCommand(this.instance));
    this.registerCommand(new InviteCommand(this.instance));
    this.registerCommand(new SupportCommand(this.instance));
    this.registerCommand(new AutobumpCommand(this.instance));
    this.registerCommand(new NsfwCommand(this.instance));
    this.registerCommand(new SetBannerCommand(this.instance));
    this.registerCommand(new SetChannelCommand(this.instance));
    this.registerCommand(new SetColorCommand(this.instance));
    this.registerCommand(new SetDescriptionCommand(this.instance));
    this.registerCommand(new SetInviteCommand(this.instance));
    this.registerCommand(new PreviewCommand(this.instance));
    this.registerCommand(new VoteCommand(this.instance));
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
