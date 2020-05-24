import socket from "socket.io";
import Hub from "./Hub";
import ShardManager from "./ShardManager";
import Utils from "./Utils";

interface ISetupData {
  id: number;
  total: number;
}

interface IStatsShardData {
  guilds: number;
  users: number;
  uptime: number | null;
  discordping: number;
}

interface IStatsData {
  [shard: number]: IStatsShardData | "timeout" | "disconnected";
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
    socket.on("message", this.onMessage.bind(this));
    socket.on("bump", this.onBump.bind(this));
    socket.on("sblpOutside", this.onSBLPOutside.bind(this));
    socket.on("stats", this.onStats.bind(this));

    socket.emit("identified", {
      id: this.id,
      total: this.shardManager.total
    });

    Utils.Notifications.postShardConnected(this.id);
  }

  private async onDisconnect() {
    this.disconnect(false);
  }

  private onReady() {
    console.log(`Shard #${this.id} confirmed it's ready.`);
    Utils.Notifications.postShardReady(this.id);
    this.ready = true;
  }

  private async onSetup(callback: (setupData: ISetupData) => void) {
    console.log(`Shard #${this.id} requested setup.`);
    callback({
      id: this.id,
      total: this.shardManager.total
    });
  }

  private async onMessage(
    guild: string,
    channel: string,
    content: string,
    resolve: (id: string | null) => void
  ) {
    const shardId = Utils.getShardId(guild, this.shardManager.total);
    const targetShard = this.shardManager.getShardById(shardId);
    if (targetShard) {
      // Shard has been found
      targetShard.socket.emit("message", guild, channel, content, resolve);
    } else {
      // Shard not found; return null
      return void resolve(null);
    }
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

  private async onSBLPOutside(provider: string, payload: any, message: any) {
    if (payload["guild"]) {
      // Only send to shard with guild
      const shardId = Utils.getShardId(
        payload["guild"],
        this.shardManager.total
      );
      const targetShard = this.shardManager.getShardById(shardId);
      targetShard?.socket.emit("sblpOutside", provider, payload, message);
    } else {
      // Send to all other shards
      const shards = this.shardManager.getOtherShards(this.id);
      for (const shard of shards)
        shard.socket.emit("sblpOutside", provider, payload, message);
    }
  }

  private async onStats(callback: (data: IStatsData) => void) {
    const shards = this.shardManager.getOtherShards();
    const response: IStatsData = {};
    await Promise.all(
      shards.map(
        (shard) =>
          new Promise(async (resolve) => {
            if (!shard) return resolve();
            const timeout = Number(
              setTimeout(() => {
                response[shard.id] = "timeout";
                resolve;
              }, 1000 * 5)
            );
            const data = await new Promise<IStatsShardData>((resolve) => {
              shard.socket.emit("stats", resolve);
            });
            clearTimeout(timeout);
            response[shard.id] = data;
            resolve();
          })
      )
    );
    for (let id = 0; id < this.shardManager.total; id++)
      if (!response[id]) response[id] = "disconnected";
    callback(response);
  }

  public disconnect(force = false) {
    console.log(
      `Shard #${this.id} is disconnecting ${force ? "by" : "without"} force...`
    );
    if (!force) this.instance.shardManager.shards[this.id] = undefined;
    Utils.Notifications.postShardDisconnected(this.id, force);
  }
}
