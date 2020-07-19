import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.6.0",
  up: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "autobumpNotifications" Column To "Guild" */
      await queryInterface.addColumn(
        "Guild",
        "autobumpNotifications",
        datatypes.STRING(20),
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
  down: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "autobumpNotifications" Column From "Guild" */
      await queryInterface.removeColumn("Guild", "autobumpNotifications", {
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
