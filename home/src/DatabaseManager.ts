import path from "path";
import { Sequelize } from "sequelize-typescript";
import config from "./config";
import OpenBump from "./OpenBump";

export default class DatabaseManager {
  public sequelize: Sequelize;

  constructor(private instance: OpenBump) {
    const modelDir = path.join(this.instance.directory, "models");

    this.sequelize = new Sequelize({
      ...config.database,
      models: [modelDir],
      logging: false,
      isolationLevel: "READ COMMITTED"
    });
  }

  public async init() {
    console.log("Connecting to database...");
    await this.sequelize.authenticate();
    console.log("Connection to database has been established successfully");
  }
}
