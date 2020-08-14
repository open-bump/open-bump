import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.6.1",
  up: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "lastVotedAt" Column To "User" */
      await queryInterface.addColumn("User", "lastVotedAt", datatypes.DATE, {
        transaction
      });

      /* Remove "voted" Column From "Reminder" */
      await queryInterface.removeColumn("Reminder", "voted", {
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
  down: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "lastVotedAt" Column From "User" */
      await queryInterface.removeColumn("User", "lastVotedAt", {
        transaction
      });

      /* Add "voted" Column To "Reminder" */
      await queryInterface.addColumn("Reminder", "voted", datatypes.BOOLEAN, {
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
