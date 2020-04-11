import bcrypt from "bcryptjs";
import { MessageEmbedOptions } from "discord.js";
import io from "socket.io-client";
import config from "./config";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";
import Utils from "./Utils";

export default class NetworkManager {
  public id: number;
  public total!: number;
  private socket!: SocketIOClient.Socket;

  constructor(private instance: OpenBump) {
    this.id = config.discord.shard;
  }

  public async init() {
    const token = config.discord.token;
    const hashed = bcrypt.hashSync(token, bcrypt.genSaltSync(10));

    this.socket = io("http://localhost:3000", {
      query: { authorization: hashed, shard: this.id }
    });
    console.log("Waiting for connection with hub...");

    this.total = await new Promise((resolve) =>
      {
        this.socket.once("connect", () => {
          console.log("Hub connected, awaiting setup...");
          this.socket.emit('setup', (total: number) => {
            return resolve(total);
          });
        });
      }
    );
    console.log(`Received ${this.total} total shards.`);
  }

  private async onBump(
    guild: string,
    embed: object,
    origin: number,
    callback: (amount: number) => void
  ) {
    if (origin === this.id) return;
    const guildDatabase = await Guild.findOne({ where: { id: guild } });
    if (!guildDatabase) return;
    const amount = await Utils.Bump.bumpToThisShard(guildDatabase, embed);
    callback(amount);
  }

  public async emitBump(guild: string, embed: MessageEmbedOptions) {
    this.socket.emit("bump", guild, embed);
  }
}
