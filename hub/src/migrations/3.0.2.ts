import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.0.2",
  up: async (connection, datatypes) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "nsfw" Column To "Guild" Table */
      await queryInterface.addColumn(
        "Guild",
        "nsfw",
        {
          type: datatypes.BOOLEAN
        },
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

      /* Remove "nsfw" Column From "Guild" Table */
      await queryInterface.removeColumn("Guild", "nsfw", { transaction });

      /* Commit Transaction */
      await transaction.commit();
    } catch (error) {
      console.error("Error in migration, rolling back...");
      await transaction.rollback();
      throw error;
    }
  }
};

export default migration;
