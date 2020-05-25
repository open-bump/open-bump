import { SuccessfulParsedMessage } from "discord-command-parser";
import { MessageEmbedOptions } from "discord.js";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class BadgesCommand extends Command {
  public name = "badges";
  public aliases = ["badge"];
  public syntax = "badges";
  public description = "View all available badges";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    _guildDatabase: Guild
  ) {
    const { channel } = message;

    const embed: MessageEmbedOptions = {
      title: `Bump Badges`,
      description:
        `${Utils.Emojis.SUPPORT_SERVER} - Official Bot Support Server\n` +
        `${Utils.Emojis.VERIFIED_SERVER} - Verified Discord Servers\n` +
        `${Utils.Emojis.PARTNERED_SERVER} - Discord Partnered Server\n` +
        `${Utils.Emojis.FEATURED} - Featured Server\n` +
        `${Utils.Emojis.BOOST_3} - Server Boosted Level 3\n` +
        `${Utils.Emojis.BOOST_2} - Server Boosted Level 2\n` +
        `${Utils.Emojis.BOOST_1} - Server Boosted Level 1`,
      thumbnail: {
        url: this.instance.client.user?.displayAvatarURL()
      }
    };
    await channel.send({ embed });
  }
}
