import { SuccessfulParsedMessage } from "discord-command-parser";
import ms from "ms";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class PingCommand extends Command {
  public name = "ping";
  public syntax = "ping";
  public description = "View the bot's ping";
  public vanished = true;

  public async run(
    { message }: SuccessfulParsedMessage<GuildMessage>,
    _guildDatabase: Guild
  ) {
    const { channel } = message;

    const connected = this.instance.networkManager.connected;
    const ping = this.instance.client.ws.ping;
    let danger = false;

    if (ping >= 1000) danger = true;
    else if (!connected) danger = true;

    const embed = {
      color: danger ? Utils.Colors.ORANGE : Utils.Colors.BLUE,
      title: `${
        danger ? Utils.Emojis.IMPORTANTNOTICE : Utils.Emojis.INFORMATION
      } Ping`,
      fields: [
        {
          name: "Websocket Hearthbeat",
          value: `\`\`\`${ms(this.instance.client.ws.ping)}\`\`\``,
          inline: true
        },
        {
          name: "Shard ID",
          value: `\`\`\`${this.instance.networkManager.id}/${this.instance.networkManager.total}\`\`\``,
          inline: true
        },
        {
          name: "Manager",
          value: `\`\`\`${connected ? "connected" : "disconnected"}\`\`\``,
          inline: true
        }
      ]
    };
    return void (await channel.send({ embed }));
  }
}
