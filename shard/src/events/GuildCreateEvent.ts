import Discord, { ClientEvents } from "discord.js";
import Event from "../Event";
import Utils from "../Utils";

export default class GuildCreateEvent extends Event {
  public name: keyof ClientEvents = "guildCreate";

  public async run(guild: Discord.Guild) {
    if (!this.instance.ready)
      return void console.log(
        `Ignoring message event as client isn't ready yet`
      );

    const guildDatabase = await Utils.ensureGuild(guild);
    guildDatabase.lastFailedAt = null;
    if (guildDatabase.changed()) await guildDatabase.save();

    await Utils.Notifications.postGuildAdded(guild);
  }
}
