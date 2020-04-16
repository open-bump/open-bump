import { ParsedMessage } from "discord-command-parser";
import ms from "ms";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils from "../Utils";

export default class PingCommand extends Command {
  public name = "ping";
  public syntax = "ping";
  public description = "View the bot's ping";

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel } = message;
    const packageJson = Utils.getPackageJson();
    const embed = {
      color: Utils.Colors.BLUE,
      title: `${Utils.Emojis.INFORMATION} Ping`,
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
          value: `\`\`\`${
            this.instance.networkManager.connected
              ? "connected"
              : "disconnected"
          }\`\`\``,
          inline: true
        }
      ]
    };
    return void (await channel.send({ embed }));
  }
}
