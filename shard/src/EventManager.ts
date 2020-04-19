import Event from "./Event";
import GuildCreateEvent from "./events/GuildCreateEvent";
import GuildDeleteEvent from "./events/GuildDeleteEvent";
import MessageEvent from "./events/MessageEvent";
import ReadyEvent from "./events/ReadyEvent";
import OpenBump from "./OpenBump";

export default class EventManager {
  constructor(private instance: OpenBump) {
    this.registerEvents();
  }

  private registerEvents() {
    this.registerEvent(new GuildCreateEvent(this.instance));
    this.registerEvent(new GuildDeleteEvent(this.instance));
    this.registerEvent(new ReadyEvent(this.instance));
    this.registerEvent(new MessageEvent(this.instance));
  }

  private registerEvent(event: Event) {
    this.instance.client.on(event.name, event.run.bind(event));
  }
}
