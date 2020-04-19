import Discord, { ClientEvents } from "discord.js";
import Event from "../Event";
import Utils from "../Utils";

export default class GuildCreateEvent extends Event {
  public name: keyof ClientEvents = "guildCreate";

  public async run(guild: Discord.Guild) {
    await Utils.Notifications.postGuildAdded(guild);
  }
}
