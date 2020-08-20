import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "1.0.1",
  up: async (connection, datatypes) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "host" Column To "Application" Table */
      await queryInterface.addColumn(
        "Application",
        "host",
        {
          type: datatypes.STRING(64),
          unique: true
        },
        {
          transaction
        }
      );

      /* Add "authorization" Column To "ApplicationService" Table */
      await queryInterface.addColumn(
        "ApplicationService",
        "authorization",
        datatypes.STRING,
        { transaction }
      );

      /* Commit Transaction */
      await transaction.commit();
    } catch (error) {
      console.error("Error in migration, rolling back...");
      await transaction.rollback();
      throw error;
    }
  },
  down: async (connection: Sequelize) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "host" Column From "Application" Table */
      await queryInterface.removeColumn("Application", "host", { transaction });

      /* Remove "authorization" Column From "ApplicationService" Table */
      await queryInterface.removeColumn("ApplicationService", "authorization", {
        transaction
      });

      await transaction.commit();
    } catch (error) {
      console.error("Error in migration, rolling back...");
      await transaction.rollback();
      throw error;
    }
  }
};

export default migration;
