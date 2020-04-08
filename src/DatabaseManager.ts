import { Sequelize } from "sequelize-typescript";
import config from "./config";
import path from "path";
import OpenBump from "./OpenBump";

export default class DatabaseManager {
  private sequelize: Sequelize;

  constructor() {
    const modelDir = path.join(OpenBump.directory, "models");

    this.sequelize = new Sequelize({
      ...config.database,
      models: [modelDir]
    });
  }

  public async init() {
    console.log("Connecting to database...");
    await this.sequelize.authenticate();
    console.log("Connection to database has been established successfully");
  }
}
