import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.1.9",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "sandbox" Column To "Guild" */
      await queryInterface.addColumn("Guild", "sandbox", datatypes.BOOLEAN, {
        transaction
      });

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

      /* Remove "sandbox" Column From "Guild" */
      await queryInterface.removeColumn("Guild", "sandbox", {
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
