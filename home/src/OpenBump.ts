import Discord from "discord.js";
import config from "./config";
import DatabaseManager from "./DatabaseManager";
import EventManager from "./EventManager";
import Premium from "./Premium";

export default class OpenBump {
  public static instance: OpenBump;

  public directory = __dirname;

  public client: Discord.Client;
  public eventManager: EventManager;
  public databaseManager: DatabaseManager;
  public premium: Premium;

  public ready = false;

  constructor() {
    OpenBump.instance = this;

    this.client = new Discord.Client({
      fetchAllMembers: true,
      ws: {
        intents: [
          "GUILDS",
          "GUILD_MESSAGES",
          "GUILD_MESSAGE_REACTIONS",
          "GUILD_MEMBERS"
        ]
      }
    });

    this.eventManager = new EventManager(this);
    this.databaseManager = new DatabaseManager(this);
    this.premium = new Premium(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();

    console.log("Logging in to Discord...");
    await this.client.login(config.discord.token);
  }

  public async customStatusLoop() {
    this.client.user?.setPresence({
      status: "online"
    });

    setTimeout(this.customStatusLoop.bind(this), 1000 * 60 * 15); // Update every 15 minutes
  }
}
