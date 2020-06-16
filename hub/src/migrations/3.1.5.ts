import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.1.5",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "blocked" Column To "Guild" */
      await queryInterface.addColumn(
        "Guild",
        "blocked",
        {
          type: datatypes.STRING
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
      await queryInterface.removeColumn("Guild", "blocked", {
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
