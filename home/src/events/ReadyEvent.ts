import { ClientEvents } from "discord.js";
import Event from "../Event";

export default class ReadyEvent extends Event {
  public name: keyof ClientEvents = "ready";

  private first = true;

  public async run() {
    console.log(`Logged in as ${this.instance.client.user?.tag}`);

    if (this.first) {
      this.instance.customStatusLoop();
      await this.instance.premium.init();
    }

    this.instance.ready = true;

    this.first = false;
  }
}
