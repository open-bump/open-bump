import { ParsedMessage } from "discord-command-parser";
import ms from "ms";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils from "../Utils";

export default class StatsCommand extends Command {
  public name = "stats";
  public syntax = "stats";
  public description = "View the bot's stats";
  public vanished = true;

  public async run({ message }: ParsedMessage, guildDatabase: Guild) {
    const { channel } = message;

    const statsData = await this.instance.networkManager.requestStats();

    const embed = {
      color: Utils.Colors.BLUE,
      title: `${Utils.Emojis.INFORMATION} Stats`,
      fields: Object.keys(statsData)
        .map(Number)
        .sort((a: number, b: number) => a - b)
        .map((id) => {
          const stats = statsData[id];
          let error = false;
          if (stats === "timeout") error = true;
          else if (stats === "disconnected") error = true;
          return {
            name: `Shard #${id}/${this.instance.networkManager.total}${
              this.instance.networkManager.id === id ? " (current)" : ""
            }`,
            value:
              `\`\`\`${error ? "diff" : "yaml"}\n` +
              (stats === "timeout"
                ? "- Timeout \n \n "
                : stats === "disconnected"
                ? "- Disconnected \n \n "
                : `Servers: ${stats.guilds}\n` +
                  `Users: ${stats.users}\n` +
                  `Uptime: ${ms(stats.uptime || 0)}`) +
              `\`\`\``,
            inline: true
          };
        })
    };
    return void (await channel.send({ embed }));
  }
}
