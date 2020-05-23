import { SuccessfulParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import OpenBump from "../OpenBump";
import Utils, { GuildMessage } from "../Utils";

export default class HelpCommand extends Command {
  public name = "help";
  public syntax = "help [command]";
  public description = "View a list of available commands";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel } = message;
    if (args.length === 0) {
      const embed = {
        color: Utils.Colors.GREEN,
        title: `${Utils.Emojis.INFORMATION} Help`,
        description: `To view more information about a command, use the command \`${Utils.getPrefix(
          guildDatabase
        )}help <command>\``,
        thumbnail: {
          url: this.instance.client.user?.displayAvatarURL()
        },
        fields: [
          {
            name: "Command List",
            value: this.instance.commandManager
              .getCommands()
              .filter(({ vanished }) => !vanished)
              .map((command) => `\`${command.name}\` - ${command.description}`)
              .join("\n")
          }
        ],
        _fields: this.instance.commandManager
          .getCommands()
          .filter(({ vanished }) => !vanished)
          .map((command) => ({
            name: command.syntax,
            value: command.description
          }))
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
