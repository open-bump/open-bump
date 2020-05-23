import { SuccessfulParsedMessage } from "discord-command-parser";
import Command from "../Command";
import CommandManager from "../CommandManager";
import Guild from "../models/Guild";
import OpenBump from "../OpenBump";
import Utils, { GuildMessage } from "../Utils";

export default class HelpCommand extends Command {
  public name = "help";
  public syntax = "help [command]";
  public description = "View a list of available commands";
  public category = CommandManager.Categories.GENERAL;

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel } = message;
    if (args.length === 0) {
      const prefix = Utils.getPrefix(guildDatabase);
      const embed = {
        color: Utils.Colors.GREEN,
        title: `${this.instance.client.user?.username} | Discord Bump Bot`,
        description: `To view more information - \`${Utils.getPrefix(
          guildDatabase
        )}help <command>\`.`,
        thumbnail: {
          url: this.instance.client.user?.displayAvatarURL()
        },
        fields: [
          [CommandManager.Categories.GENERAL, "General Plugins Help"],
          [CommandManager.Categories.BUMPSET, "Bumpset Plugins Commands"],
          [CommandManager.Categories.PREMIUM, "Premium Plugins Commands"]
        ].map(([current, title]) => {
          return {
            name: title,
            value: this.instance.commandManager
              .getCommands()
              .filter(({ vanished }) => !vanished)
              .filter(({ category }) => category === current)
              .map(
                (command) =>
                  `\`${prefix}${command.name}\` - ${command.description}`
              )
              .join("\n")
          };
        }),
        footer: {
          text: Utils.getCommonFooter()
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
