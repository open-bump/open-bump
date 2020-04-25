import bcrypt from "bcryptjs";
import { MessageEmbedOptions } from "discord.js";
import io from "socket.io-client";
import config from "./config";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";
import Utils from "./Utils";

interface ISetupData {
  id: number;
  total: number;
}

export interface IStatsShardData {
  guilds: number;
  users: number;
  uptime: number | null;
  discordping: number;
}

interface IStatsData {
  [shard: number]: IStatsShardData | "timeout" | "disconnected";
}

export default class NetworkManager {
  public id!: number;
  public total!: number;
  public socket!: SocketIOClient.Socket;
  public ready = false;
  public connected = false;

  constructor(private instance: OpenBump) {}

  public async init() {
    const token = config.discord.token;
    const hashed = bcrypt.hashSync(token, bcrypt.genSaltSync(10));

    this.socket = io(config.settings.hub, {
      query: { authorization: hashed }
    });
    console.log("Waiting for connection with hub...");

    this.socket.on("connect", this.onConnect.bind(this));

    this.socket.on("identify", this.onIdentify.bind(this));

    const setupData = await new Promise<ISetupData>((resolve) => {
      this.socket.once("identified", () => {
        console.log("Hub connected, awaiting setup...");
        this.socket.emit("setup", resolve);
      });
    });
    if (
      config.discord.shard !== undefined &&
      config.discord.shard !== setupData.id
    ) {
      // Invalid ID
      console.error(
        `Received invalid shard ID ${setupData.id} from hub, expected ${config.discord.shard}. Shutting down...`
      );
      return void process.exit();
    }
    this.id = setupData.id;
    this.total = setupData.total;
    console.log(`Received ${this.total} total shards.`);

    this.socket.on("connect", async () => {
      console.log("Websocket reconnected, requesting setup.");
      const setupData = await new Promise<ISetupData>((resolve) => {
        const data = this.socket.once("identified", resolve);
        return data;
      });
      if (this.id !== setupData.id || this.total !== setupData.total) {
        console.error(
          `Did not receive same data as earlier connection. Received #${setupData.id} of ${setupData.total} but expected #${this.id} of ${this.total}. Shutting down...`
        );
        return void process.exit();
      }
      this.setReady();
      console.log("Setup data verified, connected again.");
    });

    this.socket.on("bump", this.onBump.bind(this));
    this.socket.on("stats", this.onStats.bind(this));
    this.socket.on("disconnect", this.onDisconnect.bind(this));
  }

  public async onConnect() {
    console.log("Connected to websocket");
    this.connected = true;
  }

  public async onDisconnect() {
    console.warn("Disconnected from websocket!");
    this.connected = false;
  }

  public async emitBump(
    guild: string,
    embed: MessageEmbedOptions,
    type: keyof typeof Utils.Bump.BumpType
  ) {
    const amount: number = await new Promise((resolve) =>
      this.socket.emit("bump", guild, embed, type, resolve)
    );
    return amount;
  }

  public async requestStats() {
    if (!this.connected) return [];
    const stats = await new Promise<IStatsData>((resolve) =>
      this.socket.emit("stats", resolve)
    );
    return stats;
  }

  public async requestTotalServerCount() {
    const statsData = await this.requestStats();
    return Object.keys(statsData)
      .map((id) => {
        const stats = statsData[Number(id)];
        return typeof stats === "object" ? stats.guilds : 0;
      })
      .reduce((total, num) => total + num, 0);
  }

  public async setReady() {
    this.ready = true;
    this.socket.emit("ready");
  }

  private async onBump(
    guild: string,
    embed: object,
    type: keyof typeof Utils.Bump.BumpType,
    origin: number,
    callback: (amount: number) => void
  ) {
    if (origin === this.id) return;
    const guildDatabase = await Guild.findOne({
      where: { id: guild }
    });
    if (!guildDatabase) return;
    const amount = await Utils.Bump.bumpToThisShard(guildDatabase, embed, type);
    callback(amount.length);
  }

  private async onStats(callback: (data: IStatsShardData) => void) {
    const guilds = this.instance.client.guilds.cache.size;
    const users = this.instance.client.users.cache.size;
    const uptime = this.instance.client.uptime;
    const discordping = this.instance.client.ws.ping;
    callback({ guilds, users, uptime, discordping });
  }

  public async onIdentify(callback: (shard?: number) => void) {
    callback(typeof this.id === "number" ? this.id : config.discord.shard);
  }
}
