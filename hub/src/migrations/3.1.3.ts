import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.1.3",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "hub" Column To "Guild" */
      await queryInterface.addColumn(
        "Guild",
        "hub",
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
  down: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "hub" Column From "Guild" */
      await queryInterface.removeColumn("Guild", "hub", {
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
