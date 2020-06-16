import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.1.4",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "lastFailedAt" Column To "Guild" */
      await queryInterface.addColumn(
        "Guild",
        "lastFailedAt",
        {
          type: datatypes.DATE
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
  down: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "lastFailedAt" Column From "Guild" */
      await queryInterface.removeColumn("Guild", "lastFailedAt", {
        transaction
      });

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
