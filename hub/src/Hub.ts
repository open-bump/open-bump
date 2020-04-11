import DatabaseManager from "./DatabaseManager";

export default class OpenBump {
  public static instance: OpenBump;

  public directory = __dirname;

  public databaseManager: DatabaseManager;

  constructor() {
    OpenBump.instance = this;

    this.databaseManager = new DatabaseManager(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();
  }
}
