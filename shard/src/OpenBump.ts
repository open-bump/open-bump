import Discord, { WebSocketOptions } from "discord.js";
import CommandManager from "./CommandManager";
import config from "./config";
import DatabaseManager from "./DatabaseManager";
import EventManager from "./EventManager";
import NetworkManager from "./NetworkManager";
import Premium from "./Premium";

export default class OpenBump {
  public static instance: OpenBump;

  public directory = __dirname;

  public client: Discord.Client;
  public commandManager: CommandManager;
  public eventManager: EventManager;
  public databaseManager: DatabaseManager;
  public networkManager: NetworkManager;
  private premium: Premium;

  constructor() {
    OpenBump.instance = this;

    this.client = new Discord.Client({
      ws: {
        properties: {
          $browser: "Discord Android",
          $device: "Discord Android"
        }
      } as WebSocketOptions
    });

    this.commandManager = new CommandManager(this);
    this.eventManager = new EventManager(this);
    this.databaseManager = new DatabaseManager(this);
    this.networkManager = new NetworkManager(this);
    this.premium = new Premium(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();

    console.log("Starting socket connection...");
    await this.networkManager.init();

    console.log(
      `Set client shard to ID ${this.networkManager.id} out of ${this.networkManager.total} shards.`
    );
    this.client.options.shards = [this.networkManager.id];
    this.client.options.shardCount = this.networkManager.total;

    console.log("Logging in to Discord...");
    await this.client.login(config.discord.token);

    await this.premium.init();
  }

  public async customStatusLoop() {
    const totalServers = await this.networkManager.requestTotalServerCount();
    this.client.user?.setPresence({
      status: "online",
      activity: {
        type: "WATCHING",
        name: `${config.settings.prefix}help | ${totalServers} servers | Discord Bump Bot`
      }
    });

    setTimeout(this.customStatusLoop.bind(this), 1000 * 60 * 15); // Update every 15 minutes
  }
}
