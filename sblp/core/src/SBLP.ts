import DatabaseManager from "./DatabaseManager";
import Server from "./Server";
import TaskManager from "./TaskManager";

export default class SBLP {
  public static instance: SBLP;

  public directory = __dirname;

  public databaseManager: DatabaseManager;
  public taskManager: TaskManager;
  public server: Server;

  constructor() {
    SBLP.instance = this;

    this.databaseManager = new DatabaseManager(this);
    this.taskManager = new TaskManager(this);
    this.server = new Server(this);

    this.init();
  }

  private async init() {
    await this.databaseManager.init();
    await this.server.init();
  }
}
