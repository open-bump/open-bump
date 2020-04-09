import config from "./config";
import Discord from "discord.js";
import CommandManager from "./CommandManager";
import EventManager from "./EventManager";
import DatabaseManager from "./DatabaseManager";

export default class OpenBump {
  public static instance: OpenBump;

  public directory = __dirname;

  public client: Discord.Client;
  public commandManager: CommandManager;
  public eventManager: EventManager;
  public databaseManager: DatabaseManager;

  constructor() {
    OpenBump.instance = this;

    this.client = new Discord.Client();

    this.commandManager = new CommandManager();
    this.eventManager = new EventManager(this);
    this.databaseManager = new DatabaseManager(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();

    console.log("Logging in to Discord...");
    await this.client.login(config.discord.token);
  }
}
