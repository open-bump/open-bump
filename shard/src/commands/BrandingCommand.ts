import { SuccessfulParsedMessage } from "discord-command-parser";
import Command from "../Command";
import config from "../config";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class BrandingCommand extends Command {
  public name = "branding";
  public aliases = ["brand"];
  public syntax = "branding [size]";
  public description = "View branding of the bot";
  public vanished = true;

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    _guildDatabase: Guild
  ) {
    const { channel } = message;

    const bot = this.instance.client.user;
    const invite = await this.instance.client.fetchInvite(
      config.settings.support
    );
    const guild = invite.guild;
    const guildLogoAnimated = guild?.icon?.startsWith("a_");
    const size = this.getSize(args[0]);

    const embed = {
      color: Utils.Colors.BLUE,
      title: `${Utils.Emojis.INFORMATION} ${this.instance.client.user?.username} Branding`,
      thumbnail: {
        url: bot?.displayAvatarURL()
      },
      fields: [
        {
          name: "Colors",
          value:
            `**Primary:** \`${Utils.colorToText(
              Utils.Colors.OPENBUMP,
              false
            )}\`\n` +
            `**Success:** \`${Utils.colorToText(
              Utils.Colors.GREEN,
              false
            )}\`\n` +
            `**Information:** \`${Utils.colorToText(
              Utils.Colors.BLUE,
              false
            )}\`\n` +
            `**Attention:** \`${Utils.colorToText(
              Utils.Colors.ORANGE,
              false
            )}\`\n` +
            `**Error:** \`${Utils.colorToText(Utils.Colors.RED, false)}\``
        },
        {
          name: "Bot Logo",
          value: bot?.displayAvatarURL({ size, format: "png" })
        },
        {
          name: guildLogoAnimated ? "Server Logo Static" : "Logo",
          value: guild?.iconURL({ size, format: "png" })
        },
        ...(guildLogoAnimated
          ? [
              {
                name: "Server Logo Animated",
                value: guild?.iconURL({ size, format: "gif", dynamic: true })
              }
            ]
          : [])
      ]
    };
    await channel.send({ embed });
  }

  private getSize(
    input?: string
  ): 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | undefined {
    if (!input) return;
    const num = parseInt(input);
    if (![16, 32, 64, 128, 256, 512, 1024, 2048].includes(num)) return;
    return num as any;
  }
}
