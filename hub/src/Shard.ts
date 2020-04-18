import socket from "socket.io";
import Hub from "./Hub";
import ShardManager from "./ShardManager";

interface ISetupData {
  id: number;
  total: number;
}

interface IStatsData {
  [shard: number]: { guilds: number; users: number };
}

export default class Shard {
  public ready = false;

  constructor(
    private instance: Hub,
    private shardManager: ShardManager,
    private socket: socket.Socket,
    public id: number
  ) {
    socket.on("disconnect", this.onDisconnect.bind(this));
    socket.on("setup", this.onSetup.bind(this));
    socket.on("ready", this.onReady.bind(this));
    socket.on("bump", this.onBump.bind(this));
    socket.on("stats", this.onStats.bind(this));

    socket.emit("identified", {
      id: this.id,
      total: this.shardManager.total
    });
  }

  private async onDisconnect() {
    this.disconnect(false);
  }

  private onReady() {
    console.log(`Shard #${this.id} confirmed it's ready.`);
    this.ready = true;
  }

  private async onSetup(callback: (setupData: ISetupData) => void) {
    console.log(`Shard #${this.id} requested setup.`);
    callback({
      id: this.id,
      total: this.shardManager.total
    });
  }

  private async onBump(
    guild: string,
    embed: object,
    type: string,
    callback: (amount: number) => void
  ) {
    const shards = this.shardManager.getOtherShards(this.id);
    const total = await Promise.all(
      shards.map(
        (shard) =>
          new Promise<number>((resolve, reject) => {
            shard.socket.emit(
              "bump",
              guild,
              embed,
              type,
              this.id,
              (amount: number) => {
                resolve(amount);
              }
            );
          })
      )
    );
    return void callback(
      total.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
    );
  }

  private async onStats(callback: (data: IStatsData) => void) {
    const shards = this.shardManager.getOtherShards();
    const response: IStatsData = {};
    await Promise.all(
      shards.map(
        (shard) =>
          new Promise(async (resolve) => {
            const data = await new Promise<{
              guilds: number;
              users: number;
            }>((resolve) => {
              shard.socket.emit("stats", resolve);
            });
            response[shard.id] = data;
            resolve();
          })
      )
    );
    callback(response);
  }

  public disconnect(force = false) {
    console.log(
      `Shard #${this.id} is disconnecting ${force ? "by" : "without"} force...`
    );
    if (!force) this.instance.shardManager.shards[this.id] = undefined;
  }
}
