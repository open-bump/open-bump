import socket from "socket.io";
import { throws } from "assert";
import Hub from "./Hub";

export default class Shard {
  public id: number;

  constructor(private instance: Hub, private socket: socket.Socket) {
    this.id = socket.request._query.shard;

    socket.on("disconnect", this.onDisconnect.bind(this));
  }

  private onDisconnect() {
    this.disconnect(false);
  }

  public disconnect(force = false) {
    console.log(
      `Shard ${this.id} is disconnecting ${force ? "by" : "without"} force...`
    );
    if(!force) this.instance.serverManager.shards[this.id] = undefined;
  }
}
