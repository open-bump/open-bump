import bcrypt from "bcryptjs";
import express from "express";
import * as http from "http";
import socket from "socket.io";
import config from "./config";
import Hub from "./Hub";
import Shard from "./Shard";

interface IHandshakeQuery {
  authorization: string;
}

export default class ShardManager {
  private app: express.Application;
  private http: http.Server;
  public io: socket.Server;
  public total: number;

  public shards: { [id: number]: Shard | undefined } = {};

  constructor(private instance: Hub) {
    this.app = express();
    this.http = http.createServer(this.app);
    this.io = socket(this.http);
    this.total = config.discord.shards;

    this.io.use((socket, next) => {
      const { authorization }: IHandshakeQuery = socket.request._query;
      if (authorization === undefined) return void next({});
      const verified = bcrypt.compareSync(config.discord.token, authorization);
      if (!verified) return void next({});
      next();
    });

    this.register();
  }

  public getFreeShardId(focus?: number): number {
    const free = [];
    for (let i = 0; i < this.total; i++) {
      if (!this.shards[i]) free.push(i);
    }
    if (typeof focus === "number" && free.includes(focus)) return focus;
    return free[0];
  }

  public getOtherShards(except?: number): Array<Shard> {
    const shards = Object.values(this.shards);
    const filtered = shards.filter(
      (shard) => shard?.ready && shard.id !== except
    ) as Array<Shard>;
    return filtered;
  }

  public getShardById(id: number): Shard | undefined {
    return this.shards[id];
  }

  private register() {
    this.io.on("connection", async (socket) => {
      const requestedId: number | undefined = await new Promise((resolve) =>
        socket.emit("identify", resolve)
      );
      const id = this.getFreeShardId(requestedId);
      console.log(
        `New shard requesting ${
          typeof requestedId === "number"
            ? `ID ${requestedId}`
            : "no specific ID"
        } connecting. Assigned ID #${id}.`
      );
      if (this.shards[id]) {
        console.log(`Kicking out current shard with ID #${id}.`);
        this.shards[id]?.disconnect(true);
      }
      const shard = new Shard(this.instance, this, socket, id);
      this.shards[id] = shard;
      console.log(`Shard #${id} connected.`);
    });
  }

  public async init() {
    const port = config.settings.port;
    await new Promise((resolve) => this.http.listen(port, resolve));
    console.log(`Listening on *:${port}`);
  }
}
