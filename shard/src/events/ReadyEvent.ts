import Event from "../Event";
import { ClientEvents } from "discord.js";

export default class ReadyEvent extends Event {
  public name: keyof ClientEvents = "ready";

  public async run() {
    console.log(`Logged in as ${this.instance.client.user?.tag}`);
    this.instance.networkManager.setReady();
  }
}
