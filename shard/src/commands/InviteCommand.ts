import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import CommandManager from "../CommandManager";
import config from "../config";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class InviteCommand extends Command {
  public name = "invite";
  public syntax = "invite";
  public description = "Get an invite link to invite the bot";
  public category = CommandManager.Categories.GENERAL;

  public async run(
    { message }: ParsedMessage<GuildMessage>,
    _guildDatabase: Guild
  ) {
    const { channel } = message;

    const items: { [name: string]: string } = {
      "Add PYS Bump": `**[Click Here](${Utils.getInviteLink()})**`,
      "Upvote The Bot": `**[Click Here](${Utils.Lists.getLinkTopGG()})**`,
      "Bot Guide": `**[Click Here](${config.settings.meta.guide})**`,
      "Support Server": `**[Click Here](${config.settings.support})**`,
      "Add Radio X": `**[Click Here](${config.settings.meta.radioXInvite})**`,
      "Buy Premium": `**[Click Here](${config.settings.patreon})**`
    };

    const embed = {
      color: Utils.Colors.BLUE,
      thumbnail: {
        url: this.instance.client.user?.displayAvatarURL()
      },
      fields: Object.keys(items).map((key) => ({
        name: key,
        value: `${items[key]}`,
        inline: true
      }))
    };
    return void (await channel.send({ embed }));
  }
}
