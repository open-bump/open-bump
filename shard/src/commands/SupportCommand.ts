import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import config from "../config";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class SupportCommand extends Command {
  public name = "support";
  public syntax = "support";
  public description = "Get an invite link to the support server";
  public general = true;

  public async run(
    { message }: ParsedMessage<GuildMessage>,
    _guildDatabase: Guild
  ) {
    const { channel } = message;

    const invite = await this.instance.client.fetchInvite(
      config.settings.support
    );

    const embed = {
      color: Utils.Colors.BLUE,
      thumbnail: {
        url: invite.guild?.iconURL()
      },
      fields: [
        {
          name: "Support Server Link",
          value: `**[Join ${invite.guild?.name}](${invite})**`
        },
        {
          name: "Support Server Details",
          value:
            `${Utils.Emojis.ONLINE} ${invite.presenceCount} Online ` +
            `${Utils.Emojis.INVISIBLE} ${invite.memberCount} Total`
        }
      ]
    };
    return void (await channel.send({ embed }));
  }
}
