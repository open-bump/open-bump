import Event from "../Event";

export default class ReadyEvent extends Event {
  public name = "ready";

  public async run() {
    console.log(`Logged in as ${this.instance.client.user?.tag}`);
    this.instance.networkManager.setReady();
  }
}
