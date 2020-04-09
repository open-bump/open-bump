import Event from "../Event";
import Discord from "discord.js";

export default class MessageEvent extends Event {
  public name = "message";

  public async run(message: Discord.Message) {
    await this.instance.commandManager.run(message);
  }
}
