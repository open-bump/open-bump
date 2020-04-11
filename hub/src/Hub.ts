import DatabaseManager from "./DatabaseManager";
import ServerManager from "./ServerManager";
import Shard from "./Shard";

export default class Hub {
  public static instance: Hub;

  public directory = __dirname;

  public databaseManager: DatabaseManager;
  public serverManager: ServerManager;

  constructor() {
    Hub.instance = this;

    this.databaseManager = new DatabaseManager(this);
    this.serverManager = new ServerManager(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();
    await this.serverManager.init();
  }
}
