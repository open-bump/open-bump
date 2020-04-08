import OpenBump from "./OpenBump";
import Event from "./Event";
import ReadyEvent from "./events/ReadyEvent";

export default class EventManager {
  constructor(private instance: OpenBump) {
    this.registerEvents();
  }

  private registerEvents() {
    this.registerEvent(new ReadyEvent(this.instance));
  }

  private registerEvent(event: Event) {
    this.instance.client.on(event.name, event.run.bind(event));
  }
}
