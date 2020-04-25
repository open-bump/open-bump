import { ParsedMessage } from "discord-command-parser";
import ms from "ms";
import Command from "../Command";
import config from "../config";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class VoteCommand extends Command {
  public name = "vote";
  public syntax = "vote";
  public description = `Vote for this bot to get a cooldown reduction`;

  public async run(
    { message }: ParsedMessage<GuildMessage>,
    _guildDatabase: Guild
  ) {
    const { channel, author } = message;

    const voted = await Utils.Lists.hasVotedTopGG(author.id);
    const link = Utils.Lists.getLinkTopGG();

    const embed = {
      color: voted ? Utils.Colors.GREEN : Utils.Colors.BLUE,
      title: `${
        voted ? Utils.Emojis.CHECK : Utils.Emojis.INFORMATION
      } Vote for ${this.instance.client.user?.username}`,
      description:
        `**Vote Link:** ${link}\n` +
        `**Status:** ${
          voted
            ? "You already have voted in the last 12 hours"
            : "You have not voted yet"
        }\n` +
        `\n` +
        `By voting for ${
          this.instance.client.user?.username
        }, you can reduce your cooldown by up to ${ms(
          config.settings.cooldown.vote * 60 * 1000,
          { long: true }
        )} for 12 hours.\n` +
        `After 12 hours, just vote again to unlock your super power again!`
    };
    return void (await channel.send({ embed }));
  }
}
