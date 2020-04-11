import { Op } from "sequelize";
import { DataType, Sequelize } from "sequelize-typescript";
import { Migration } from "./Migrator";

export class MigrationAdapter {
  private static STORAGE_TABLE_NAME = "MigrationData";

  private connection!: Sequelize;

  constructor() {}

  public setConnection(connection: Sequelize) {
    this.connection = connection;
    return this;
  }

  public getConnection() {
    return this.connection;
  }

  public async createMigrationTableIfNotExists(): Promise<void> {
    const qi = this.connection.getQueryInterface();
    const tables = await qi.showAllTables();

    if (!tables.includes(MigrationAdapter.STORAGE_TABLE_NAME)) {
      await qi.createTable(
        MigrationAdapter.STORAGE_TABLE_NAME,
        {
          version: { type: DataType.STRING(100), primaryKey: true },
          up: {
            type: DataType.TEXT
          },
          down: {
            type: DataType.TEXT
          },
          inserted: {
            type: DataType.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
          }
        },
        { charset: "utf8mb4" }
      );
    }
  }

  public async getAllRows(): Promise<Array<Migration>> {
    return ((await this.connection.getQueryInterface().rawSelect(
      MigrationAdapter.STORAGE_TABLE_NAME,
      {
        plain: false
      } as any,
      ""
    )) as unknown) as Array<Migration>;
  }

  public async insertNewRows(rows: Array<Migration>): Promise<void> {
    if (rows.length) {
      await this.connection
        .getQueryInterface()
        .bulkInsert(MigrationAdapter.STORAGE_TABLE_NAME, rows, {}, [
          "version",
          "up",
          "down"
        ]);
    }
  }

  public async deleteRows(rows: Array<Migration>): Promise<void> {
    if (rows.length) {
      await this.connection
        .getQueryInterface()
        .bulkDelete(MigrationAdapter.STORAGE_TABLE_NAME, {
          version: { [Op.in]: rows.map((row) => row.version) }
        });
    }
  }
}
