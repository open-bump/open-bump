import Discord, { ClientEvents } from "discord.js";
import Event from "../Event";
import Utils from "../Utils";

export default class GuildDeleteEvent extends Event {
  public name: keyof ClientEvents = "guildDelete";

  public async run(guild: Discord.Guild) {
    await Utils.Notifications.postGuildRemoved(guild);
  }
}
