import bcrypt from "bcryptjs";
import express from "express";
import * as http from "http";
import socket from "socket.io";
import config from "./config";
import Hub from "./Hub";
import Shard from "./Shard";

interface IHandshakeQuery {
  authorization: string;
  shard: number;
}

export default class ServerManager {
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
      const { authorization, shard }: IHandshakeQuery = socket.request._query;
      if (authorization === undefined || shard === undefined)
        return void next({});
      if (shard >= this.total) return void next({});
      const verified = bcrypt.compareSync(config.discord.token, authorization);
      if (!verified) return void next({});
      next();
    });

    this.register();
  }

  public getOtherShards(except?: number): Array<Shard> {
    const shards = Object.values(this.shards);
    const filtered = shards.filter(
      (shard) => shard?.ready && shard.id !== except
    ) as Array<Shard>;
    return filtered;
  }

  private register() {
    this.io.on("connection", (socket) => {
      const { shard: id } = socket.request._query;
      console.log(`New shard ${id} connecting...`);
      if (this.shards[id]) {
        console.log(`Kicking out current shard.`);
        this.shards[id]?.disconnect(true);
      }
      const shard = new Shard(this.instance, this, socket);
      this.shards[id] = shard;
      console.log(`Shard ${id} connected.`);
    });
  }

  public async init() {
    const port = config.settings.port;
    await new Promise((resolve) => this.http.listen(port, resolve));
    console.log(`Listening on *:${port}`);
  }
}
