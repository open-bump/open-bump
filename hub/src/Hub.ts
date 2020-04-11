import DatabaseManager from "./DatabaseManager";
import ShardManager from "./ShardManager";

export default class Hub {
  public static instance: Hub;

  public directory = __dirname;

  public databaseManager: DatabaseManager;
  public shardManager: ShardManager;

  constructor() {
    Hub.instance = this;

    this.databaseManager = new DatabaseManager(this);
    this.shardManager = new ShardManager(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();
    await this.shardManager.init();
  }
}
