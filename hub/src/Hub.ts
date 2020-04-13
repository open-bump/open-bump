import DatabaseManager from "./DatabaseManager";
import ShardManager from "./ShardManager";
import Patreon from "./Patreon";

export default class Hub {
  public static instance: Hub;

  public directory = __dirname;

  public databaseManager: DatabaseManager;
  public shardManager: ShardManager;
  public patreon: Patreon;

  constructor() {
    Hub.instance = this;

    this.databaseManager = new DatabaseManager(this);
    this.shardManager = new ShardManager(this);
    this.patreon = new Patreon(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();
    await this.shardManager.init();
    await this.patreon.init();
  }
}
