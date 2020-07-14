import Discord from "discord.js";
import CommandManager from "./CommandManager";
import config from "./config";
import DatabaseManager from "./DatabaseManager";
import EventManager from "./EventManager";
import Integration from "./Integration";
import NetworkManager from "./NetworkManager";
import Premium from "./Premium";
import SBLP from "./SBLP";

export default class OpenBump {
  public static instance: OpenBump;

  public directory = __dirname;

  public client: Discord.Client;
  public commandManager: CommandManager;
  public eventManager: EventManager;
  public databaseManager: DatabaseManager;
  public networkManager: NetworkManager;
  public premium: Premium;
  public integration: Integration;
  public sblp: SBLP;

  public ready = false;

  constructor() {
    OpenBump.instance = this;

    this.client = new Discord.Client({
      fetchAllMembers: false,
      ws: {
        intents: [
          "GUILDS",
          "GUILD_MESSAGES",
          "GUILD_MESSAGE_REACTIONS",
          "GUILD_MEMBERS"
        ]
      },
      partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"]
    });

    this.commandManager = new CommandManager(this);
    this.eventManager = new EventManager(this);
    this.databaseManager = new DatabaseManager(this);
    this.networkManager = new NetworkManager(this);
    this.premium = new Premium(this);
    this.integration = new Integration(this);
    this.sblp = new SBLP(this);

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
