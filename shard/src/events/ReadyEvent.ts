import Event from "../Event";
import Giveaways from "../Giveaways";
import OpenBump from "../OpenBump";
import Utils from "../Utils";

export default class ReadyEvent extends Event<"ready"> {
  constructor(instance: OpenBump) {
    super(instance, "ready");
  }

  private first = true;

  public async run() {
    console.log(`Logged in as ${this.instance.client.user?.tag}`);
    this.instance.networkManager.setReady();
    if (this.first) {
      Utils.Lists.start();
      Utils.Bump.startAutobump();
      Utils.startReminder();
      Giveaways.startGiveaways();
      this.instance.customStatusLoop();
      await this.instance.premium.init();
    }

    this.instance.ready = true;

    this.first = false;
  }
}
