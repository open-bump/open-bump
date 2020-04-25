import { ParsedMessage } from "discord-command-parser";
import ms from "ms";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class StatsCommand extends Command {
  public name = "stats";
  public syntax = "stats";
  public description = "View the bot's stats";
  public general = true;

  public async run(
    { message }: ParsedMessage<GuildMessage>,
    _guildDatabase: Guild
  ) {
    const { channel } = message;

    const connected = this.instance.networkManager.connected;
    const shards = this.instance.networkManager.total;
    const statsData = connected
      ? await this.instance.networkManager.requestStats()
      : [];

    let danger = !connected;
    for (const id of Object.keys(statsData))
      danger = danger || typeof statsData[Number(id)] === "string";

    const embed = {
      color: danger ? Utils.Colors.ORANGE : Utils.Colors.BLUE,
      title: `${
        danger ? Utils.Emojis.IMPORTANTNOTICE : Utils.Emojis.INFORMATION
      } Stats`,
      thumbnail: {
        url: this.instance.client.user?.displayAvatarURL()
      },
      fields: [
        {
          name: "Manager",
          value:
            `\`\`\`${!connected ? "diff" : "yaml"}\n` +
            (connected ? `Shards: ${shards}` : "- Disconnected ") +
            `\`\`\``
        },
        ...Object.keys(statsData)
          .map(Number)
          .sort((a: number, b: number) => a - b)
          .map((id) => {
            const stats = statsData[id];
            let error = false;
            if (stats === "timeout") error = true;
            else if (stats === "disconnected") error = true;
            return {
              name: `Shard #${id}${
                this.instance.networkManager.id === id ? " (current)" : ""
              }`,
              value:
                `\`\`\`${error ? "diff" : "yaml"}\n` +
                (stats === "timeout"
                  ? "- Timeout \n \n \n "
                  : stats === "disconnected"
                  ? "- Disconnected \n \n \n "
                  : `Servers: ${stats.guilds}\n` +
                    `Users: ${stats.users}\n` +
                    `Uptime: ${ms(stats.uptime || 0)}\n` +
                    `Ping: ${ms(stats.discordping)}`) +
                `\`\`\``,
              inline: true
            };
          })
      ]
    };
    return void (await channel.send({
      embed
    }));
  }
}
