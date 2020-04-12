import Event from "../Event";
import Discord, { ClientEvents } from "discord.js";

export default class MessageEvent extends Event {
  public name: keyof ClientEvents = "message";

  public async run(message: Discord.Message) {
    await this.instance.commandManager.run(message);
  }
}
