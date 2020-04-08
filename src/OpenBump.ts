import config from "./config";
import Discord from "discord.js";
import CommandManager from "./CommandManager";
import EventManager from "./EventManager";

export default class OpenBump {
  public client: Discord.Client;
  public commandManager: CommandManager;
  public eventManager: EventManager;

  constructor() {
    this.client = new Discord.Client();

    this.commandManager = new CommandManager();
    this.eventManager = new EventManager(this);

    this.init();
  }

  private async init() {
    console.log("Logging in to Discord...");
    await this.client.login(config.discord.token);
  }
}
