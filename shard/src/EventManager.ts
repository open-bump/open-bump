import Event from "./Event";
import GuildCreateEvent from "./events/GuildCreateEvent";
import GuildDeleteEvent from "./events/GuildDeleteEvent";
import MessageEvent from "./events/MessageEvent";
import MessageReactionAddEvent from "./events/MessageReactionAddEvent";
import MessageReactionRemoveEvent from "./events/MessageReactionRemoveEvent";
import ReadyEvent from "./events/ReadyEvent";
import OpenBump from "./OpenBump";

export default class EventManager {
  constructor(private instance: OpenBump) {
    this.registerEvents();
  }

  private registerEvents() {
    this.registerEvent(new GuildCreateEvent(this.instance));
    this.registerEvent(new GuildDeleteEvent(this.instance));
    this.registerEvent(new MessageEvent(this.instance));
    this.registerEvent(new MessageReactionAddEvent(this.instance));
    this.registerEvent(new MessageReactionRemoveEvent(this.instance));
    this.registerEvent(new ReadyEvent(this.instance));
  }

  private registerEvent(event: Event<any>) {
    this.instance.client.on(event.name, event.run.bind(event));
  }
}
