import { Sequelize } from "sequelize-typescript";
import { MigrationJS } from "./helpers/Migrator";

const migration: MigrationJS = {
  version: "3.1.0",
  up: async (connection: Sequelize) => {},
  down: async (connection: Sequelize) => {}
};

export default migration;
