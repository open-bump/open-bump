import * as parser from "discord-command-parser";
import Discord from "discord.js";
import * as uuid from "uuid";
import Command from "./Command";
import AboutCommand from "./commands/AboutCommand";
import ApplicationCommand from "./commands/ApplicationCommand";
import AutobumpCommand from "./commands/AutobumpCommand";
import BadgesCommand from "./commands/BadgesCommand";
import BrandingCommand from "./commands/BrandingCommand";
import BumpCommand from "./commands/BumpCommand";
import HelpCommand from "./commands/HelpCommand";
import NsfwCommand from "./commands/NsfwCommand";
import PingCommand from "./commands/PingCommand";
import PrefixCommand from "./commands/PrefixCommand";
import PremiumCommand from "./commands/PremiumCommand";
import PreviewCommand from "./commands/PreviewCommand";
import SandboxCommand from "./commands/SandboxCommand";
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
import Utils, { EmbedError, GuildMessage, VoidError } from "./Utils";

export default class CommandManager {
  private interactive: {
    [id: string]: (() => void | Promise<void>) | void;
  } = {};

  private running: Array<string> = [];

  private commands: { [name: string]: Command } = {};

  constructor(private instance: OpenBump) {
    this.registerCommands();
  }

  public isRunning(id: string) {
    return this.running.includes(id);
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

      if (guildDatabase.blocked !== null && guildDatabase.blocked !== void 0) {
        // Guild is blocked
        const embed = {
          color: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} Restricted`,
          description:
            `This guild has been blocked from executing commands.\n` +
            `If you believe this is an error, please contact **[Support](${config.settings.support})**.` +
            (guildDatabase.blocked
              ? `\n**Reason:** ${guildDatabase.blocked}`
              : "")
        };
        return void (await channel.send({ embed }));
      }

      const userDatabase = await Utils.ensureUser(message.author);

      const id = uuid.v4();
      const unhookInteraction = () => {
        const index = this.running.indexOf(id);
        if (index > -1) {
          this.running.splice(index, 1);
          this.interactive[message.author.id] = void 0;
        }
      };
      try {
        const interactive = this.interactive[message.author.id];
        if (interactive) {
          try {
            await interactive();
          } catch (error) {}
          this.interactive[message.author.id] = void 0;
          return;
        }
        if (command.interactive) {
          this.running.push(id);
          this.interactive[message.author.id] = async () => {
            const index = this.running.indexOf(id);
            if (index > -1) this.running.splice(index, 1);
            await channel.send(`${Utils.Emojis.XMARK} ${command.interactive}`);
          };
        }
        if (guildDatabase.sandbox)
          await channel.send(
            `${Utils.Emojis.IMPORTANTNOTICE} This guild is on **Sandbox Mode**!\n` +
              `Use \`${Utils.getPrefix(
                guildDatabase
              )}sandbox toggle\` to disable.`
          );

        await command.run(
          parsed,
          guildDatabase,
          userDatabase,
          id,
          unhookInteraction
        );
      } catch (error) {
        if (error instanceof VoidError) return;
        const embed = Utils.errorToEmbed(error);
        await message.channel.send({ embed });
        if (!(error instanceof EmbedError))
          console.error(`Catched error while command execution!`, error);
      } finally {
        unhookInteraction();
      }
    }
  }

  private registerCommands() {
    this.registerCommand(new AboutCommand(this.instance));
    this.registerCommand(new ApplicationCommand(this.instance));
    this.registerCommand(new AutobumpCommand(this.instance));
    this.registerCommand(new BadgesCommand(this.instance));
    this.registerCommand(new BrandingCommand(this.instance));
    this.registerCommand(new BumpCommand(this.instance));
    this.registerCommand(new HelpCommand(this.instance));
    this.registerCommand(new NsfwCommand(this.instance));
    this.registerCommand(new PingCommand(this.instance));
    this.registerCommand(new PrefixCommand(this.instance));
    this.registerCommand(new PremiumCommand(this.instance));
    this.registerCommand(new PreviewCommand(this.instance));
    this.registerCommand(new SandboxCommand(this.instance));
    this.registerCommand(new SetBannerCommand(this.instance));
    this.registerCommand(new SetChannelCommand(this.instance));
    this.registerCommand(new SetColorCommand(this.instance));
    this.registerCommand(new SetDescriptionCommand(this.instance));
    this.registerCommand(new SetInviteCommand(this.instance));
    this.registerCommand(new StatsCommand(this.instance));
    this.registerCommand(new SupportCommand(this.instance));
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
