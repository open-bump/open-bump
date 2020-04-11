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

export default class NetworkManager {
  public id!: number;
  public total!: number;
  private socket!: SocketIOClient.Socket;

  constructor(private instance: OpenBump) {}

  public async init() {
    const token = config.discord.token;
    const hashed = bcrypt.hashSync(token, bcrypt.genSaltSync(10));

    this.socket = io("http://localhost:3000", {
      query: { authorization: hashed, shard: this.id }
    });
    console.log("Waiting for connection with hub...");

    const setupData = await new Promise<ISetupData>((resolve) =>
      {
        this.socket.once("connect", () => {
          console.log("Hub connected, awaiting setup...");
          this.socket.emit('setup', (data: ISetupData) => {
            return resolve(data);
          });
        });
      }
    );
    if(config.discord.shard !== undefined && config.discord.shard !== setupData.id) {
      // Invalid ID
      console.error(`Received invalid shard ID ${setupData.id} from hub, expected ${config.discord.shard}. Shutting down...`);
      return process.exit();
    }
    console.log('setupData', setupData);
    this.id = setupData.id;
    this.total = setupData.total;
    console.log(`Received ${this.total} total shards.`);

    this.socket.on('bump', this.onBump.bind(this));
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
