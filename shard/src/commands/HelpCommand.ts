import { SuccessfulParsedMessage } from "discord-command-parser";
import { MessageEmbedOptions } from "discord.js";
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
    const { channel, guild } = message;
    const prefix = Utils.getPrefix(guildDatabase);
    if (args.length === 0) {
      const embed: MessageEmbedOptions = {
        color: Utils.Colors.GREEN,
        title: `${this.instance.client.user?.username} Plugins Commands`,
        fields: [
          [CommandManager.Categories.GENERAL, "🤖 General", "general"],
          [CommandManager.Categories.BUMPSET, "⏫ Bumpset", "bumpset"],
          [CommandManager.Categories.PREMIUM, "💎 Premium", "premium"]
        ].map(([_category, title, slug]) => ({
          name: title,
          value: `\`${prefix}help ${slug}\``,
          inline: true
        })),
        thumbnail: {
          url: this.instance.client.user?.avatarURL() || void 0
        }
      };
      return void (await channel.send({ embed }));
    } else if (args.length === 1) {
      const categories: {
        [category: string]: [keyof typeof CommandManager.Categories, string];
      } = {
        general: [
          CommandManager.Categories.GENERAL,
          "🤖 General Plugins Commands"
        ],
        bumpset: [
          CommandManager.Categories.BUMPSET,
          "⏫ Bumpset Plugins Commands"
        ],
        premium: [
          CommandManager.Categories.PREMIUM,
          "💎 Premium Plugins Commands"
        ]
      };
      if (categories[args[0]]) {
        const [category, title] = categories[args[0]];
        const embed = {
          color: Utils.Colors.BLUE,
          title,
          description: this.instance.commandManager
            .getCommands()
            .filter(({ vanished }) => !vanished)
            .filter(({ category: cat }) => cat === category)
            .map((command) => `\`${command.name}\``)
            .join(" "),
          thumbnail: {
            url: this.instance.client.user?.avatarURL() || void 0
          }
        };
        return void (await channel.send({ embed }));
      } else {
        const command = OpenBump.instance.commandManager.getCommand(args[0]);
        const categories = {
          [CommandManager.Categories.GENERAL]: "General",
          [CommandManager.Categories.BUMPSET]: "Bumpset",
          [CommandManager.Categories.PREMIUM]: "Premium"
        };
        if (command) {
          const embed = {
            description: command.description,
            fields: [
              {
                name: "Command Information",
                value:
                  `**Usage:** \`${prefix}${command.syntax}\`\n` +
                  `**Aliases:** ${Utils.niceList(
                    command.aliases.map((alias) => `\`${alias}\``) ||
                      "*No aliases*"
                  )}\n` +
                  `**Category:** \`${categories[command.category]}\``
              }
            ]
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
      }
    } else return void (await this.sendSyntax(message, guildDatabase));
  }
}
