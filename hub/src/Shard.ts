import socket from "socket.io";
import Hub from "./Hub";
import ServerManager from "./ServerManager";

export default class Shard {
  public id: number;
  public ready = false;

  constructor(
    private instance: Hub,
    private serverManager: ServerManager,
    private socket: socket.Socket
  ) {
    this.id = socket.request._query.shard;

    socket.on("disconnect", this.onDisconnect.bind(this));
    socket.on("setup", this.onSetup.bind(this));
    socket.on("bump", this.onBump.bind(this));
  }

  private async onDisconnect() {
    this.disconnect(false);
  }

  private async onSetup(callback: (total: number) => void) {
    console.log(`Shard ${this.id} requested setup.`);
    callback(this.serverManager.total);
  }

  private async onBump(guild: string, embed: object) {
    console.log("onBump", guild);
    const shards = this.serverManager.getOtherShards(this.id);
    const total = await Promise.all(
      shards.map(
        (shard) =>
          new Promise((resolve, reject) => {
            shard.socket.emit("bump", guild, embed, (amount: number) => {
              resolve(amount);
            });
          })
      )
    );
    console.log("total", total);
  }

  public disconnect(force = false) {
    console.log(
      `Shard ${this.id} is disconnecting ${force ? "by" : "without"} force...`
    );
    if (!force) this.instance.serverManager.shards[this.id] = undefined;
  }
}
