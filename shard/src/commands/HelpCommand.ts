import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import OpenBump from "../OpenBump";
import Utils, { GuildMessage } from "../Utils";

export default class HelpCommand extends Command {
  public name = "help";
  public syntax = "help [command]";
  public description = "View a list of available commands";
  public general = true;

  public async run(
    { message, arguments: args }: ParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel } = message;
    if (args.length === 0) {
      const prefix = Utils.getPrefix(guildDatabase);
      const embed = {
        color: Utils.Colors.GREEN,
        title: `PYS Bump | Discord Bump Bot`,
        description: `To view more information - \`${Utils.getPrefix(
          guildDatabase
        )}help <command>\`.`,
        thumbnail: {
          url: OpenBump.instance.client.user?.displayAvatarURL()
        },
        fields: [
          {
            name: "General Help Plugins",
            value: this.instance.commandManager
              .getCommands()
              .filter(({ vanished }) => !vanished)
              .filter(({ general }) => general)
              .map(
                (command) =>
                  `\`${prefix}${command.name}\` - ${command.description}`
              )
              .join("\n")
          },
          {
            name: "Bumpset Help Plugins",
            value: this.instance.commandManager
              .getCommands()
              .filter(({ vanished }) => !vanished)
              .filter(({ general }) => !general)
              .map(
                (command) =>
                  `\`${prefix}${command.name}\` - ${command.description}`
              )
              .join("\n")
          }
        ],
        footer: {
          text: `Shard #${OpenBump.instance.networkManager.id} | Shard Guilds: ${OpenBump.instance.client.guilds.cache.size} | Shard Latency: ${OpenBump.instance.client.ws.ping}`
        },
        timestamp: Date.now()
      };
      return void (await channel.send({ embed }));
    } else if (args.length === 1) {
      const command = OpenBump.instance.commandManager.getCommand(args[0]);
      if (command) {
        const embed = {
          color: Utils.Colors.BLUE,
          title: `${Utils.Emojis.INFORMATION} ${command.name}`,
          description:
            `**Syntax:** ${command.syntax}\n` +
            `**Aliases:** ${Utils.niceList(
              command.aliases.map((alias) => `\`${alias}\``)
            )}\n` +
            `**Description:** ${command.description}`
        };
        return void (await channel.send({ embed }));
      } else {
        const embed = {
          color: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} Command not found`,
          description: `Make sure you entered the command name correctly. Use \`${Utils.getPrefix(
            guildDatabase
          )}help\` to view a list of all commands.`
        };
        return void (await channel.send({ embed }));
      }
    } else return void (await this.sendSyntax(message, guildDatabase));
  }
}
