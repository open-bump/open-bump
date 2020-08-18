import { Dirent, readdirSync } from "fs";
import path from "path";
import {
  cmp as semVerCmp,
  compare as semVerCompare,
  valid as semVerValid
} from "semver";
import semverRegex from "semver-regex";
import { Op } from "sequelize";
import { DataType, Sequelize } from "sequelize-typescript";
import Utils from "../../Utils";
import { MigrationAdapter } from "./MigrationAdapter";

export interface Migration {
  version: string;
  up: string;
  down: string;
}

export interface Migratable {
  version: string;
  up: (
    connection: Sequelize,
    datatypes: typeof DataType,
    op: typeof Op
  ) => Promise<void>;
  down: (
    connection: Sequelize,
    datatypes: typeof DataType,
    op: typeof Op
  ) => Promise<void>;
}

export interface MigrationOptions {
  migrations: {
    path: string;
    sort?: (a: string, b: string) => number;
  };
}

export class Migrator {
  private static defaultMigrationOptions: MigrationOptions = {
    migrations: {
      path: (undefined as unknown) as string,
      sort: (a: string, b: string) =>
        semVerCompare(a.replace(/.(js|ts)$/, ""), b.replace(/.(js|ts)$/, ""))
    }
  };

  private adapter: MigrationAdapter;
  private options: MigrationOptions;

  private requiredVersion?: string | null;
  private databaseVersion = "0.0.0";

  public constructor(adapter: MigrationAdapter, options: MigrationOptions) {
    this.adapter = adapter;
    this.options = Utils.mergeObjects(
      Migrator.defaultMigrationOptions,
      options
    ) as MigrationOptions;
  }

  public async init(): Promise<Migrator> {
    console.log("Initialize Database Migration.");

    console.log("Prepare database.");
    await this.adapter.createMigrationTableIfNotExists();

    console.log("Initialisation completed successfully.");
    return this;
  }

  public setVersion(version: string): Migrator {
    this.requiredVersion = semVerValid(version);

    if (!this.requiredVersion)
      throw new Error(
        "Invalid Version: The version is not a valid semVer 2.0.0."
      );

    return this;
  }

  public async syncMigrations(): Promise<Migrator> {
    console.log(
      `Read file metadata with path "${this.options.migrations.path}".`
    );
    const allfiles: Array<Dirent> = readdirSync(this.options.migrations.path, {
      withFileTypes: true
    });
    console.log(`Total of ${allfiles.length} files found.`);

    console.log("Read database entries.");
    const databaseState = await this.adapter.getAllRows();
    const versionsInDb = databaseState.map((row) => row.version);

    if (versionsInDb.length)
      this.databaseVersion = versionsInDb.sort(semVerCompare).reverse()[0];

    console.log("Read and filter migration files.");
    const newConfigFiles: Array<Migration> = [
      ...new Set(
        allfiles
          .filter((file) => {
            return (
              file.isFile() &&
              semverRegex().test(file.name.replace(/\.(js|ts)$/, ""))
            );
          })
          .map((file) => file.name.replace(/\.(js|ts)$/, ""))
      )
    ]
      .sort(this.options.migrations.sort)
      .map((fileName) => {
        const filePath = path.join(this.options.migrations.path, fileName);
        console.log(`Load migration from file "${filePath}".`);

        const mod = require(filePath);
        return mod?.default || mod;
      })
      .filter((dataRow: Migratable) => {
        if (!semVerValid(dataRow.version)) {
          console.log(
            `Migration "${dataRow.version}" is not a valid semVer 2.0.0.`
          );
          return false;
        }
        if (versionsInDb.includes(dataRow.version)) {
          console.log(`Migration ${dataRow.version} is already in database.`);
          return false;
        }
        if (semVerCmp(this.requiredVersion as string, "<", dataRow.version)) {
          console.log(
            `Migration ${dataRow.version} is higher than needed, do not apply yet.`
          );
          return false;
        }
        return true;
      })
      .map((row) => ({
        version: row.version,
        up: row.up.toString(),
        down: row.down.toString()
      }));

    console.log("Store new migrations in the database.");
    await this.adapter.insertNewRows(newConfigFiles);

    return this;
  }

  public async apply(): Promise<Migrator> {
    const connection = this.adapter.getConnection();
    const databaseState = await this.adapter.getAllRows();
    const versionsInDb = databaseState
      .map((row) => row.version)
      .sort(semVerCompare);
    const versionsToDelete: Array<Migration> = [];

    // compare versions
    let versionsToApply: Array<string> = [];
    let op: "down" | "up" = "up";

    if (this.requiredVersion) {
      if (semVerCmp(this.requiredVersion, "==", this.databaseVersion)) {
        console.log(`Database is up to date. No migration needed.`);
      } else {
        if (semVerCmp(this.requiredVersion, "<", this.databaseVersion)) {
          versionsToApply = versionsInDb.filter(
            (vers) =>
              semVerCmp(vers, ">", this.requiredVersion as string) &&
              semVerCmp(vers, "<=", this.databaseVersion)
          );
          op = "down";
        } else {
          versionsToApply = versionsInDb.filter(
            (vers) =>
              semVerCmp(vers, "<=", this.requiredVersion as string) &&
              semVerCmp(vers, ">", this.databaseVersion)
          );
        }
        versionsToApply.sort(semVerCompare);
        if (op === "down") {
          versionsToApply.reverse();
        }
        if (versionsToApply.length) {
          console.log(
            `Database will be ${op}graded from '${this.databaseVersion}' to '${this.requiredVersion}'.`
          );
          console.log(
            `Will execute the following migrations: '${versionsToApply.join(
              "' => '"
            )}'.`
          );
        } else {
          console.log(
            `Database has a different version '${this.databaseVersion}' than the code '${this.requiredVersion}', but we don\'t have any migrations to apply'.`
          );
        }
      }
    }

    // adapt db accordingly
    for (const migrationVersion of versionsToApply) {
      const migration = databaseState
        .filter((row) => row.version === migrationVersion)
        .pop();

      if (migration && migration[op] !== "") {
        // tslint:disable-next-line:no-eval
        const func: Function = eval(migration[op]);

        try {
          await func.call(void 0, connection, DataType, Op);
          console.log(
            `Migration Script ${migration.version} ('${op}') executed successfully.`
          );
        } catch (err) {
          console.log(
            `Migration Script ${migration.version} ('${op}') failed. Please use a try/catch with a transaction inside your migration script.`
          );
          const deletePending = versionsToApply.slice(
            versionsToApply.indexOf(migrationVersion)
          );
          await this.adapter.deleteRows(
            databaseState.filter((row) => deletePending.includes(row.version))
          );
          throw err;
        }

        if (op === "down") {
          versionsToDelete.push(migration);
        }
      }
    }

    await this.adapter.deleteRows(versionsToDelete);

    console.log(`Migration completed successfully.`);

    return this;
  }
}
