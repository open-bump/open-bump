import path from "path";
import { Sequelize } from "sequelize-typescript";
import config from "./config";
import { MigrationAdapter } from "./migrations/helpers/MigrationAdapter";
import { Migrator } from "./migrations/helpers/Migrator";
import OpenBump from "./OpenBump";
import Utils from "./Utils";

export default class DatabaseManager {
  public sequelize: Sequelize;
  private migrationAdapter: MigrationAdapter;
  private migrator: Migrator;

  constructor(private instance: OpenBump) {
    const modelDir = path.join(this.instance.directory, "models");

    this.sequelize = new Sequelize({
      ...config.database,
      models: [modelDir],
      logging: false
    });

    this.migrationAdapter = new MigrationAdapter();
    this.migrationAdapter.setConnection(this.sequelize);

    this.migrator = new Migrator(this.migrationAdapter, {
      migrations: {
        path: path.join(this.instance.directory, "migrations")
      }
    });
  }

  public async init() {
    console.log("Connecting to database...");
    await this.sequelize.authenticate();
    console.log("Running migrations...");
    const packageJson = Utils.getPackageJson();
    await this.migrator.init();
    this.migrator.setVersion(packageJson.version);
    await this.migrator.syncMigrations();
    await this.migrator.apply();
    console.log("Connection to database has been established successfully");
  }
}
