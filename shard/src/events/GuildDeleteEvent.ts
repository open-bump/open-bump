import Discord, { ClientEvents } from "discord.js";
import Event from "../Event";
import Utils from "../Utils";

export default class GuildDeleteEvent extends Event {
  public name: keyof ClientEvents = "guildDelete";

  public async run(guild: Discord.Guild) {
    if (!this.instance.ready)
      return void console.log(
        `Ignoring guildDelete event as client isn't ready yet`
      );
    const guildDatabase = await Utils.ensureGuild(guild);
    guildDatabase.lastFailedAt = new Date();
    await guildDatabase.save();

    await Utils.Notifications.postGuildRemoved(guild);
  }
}
