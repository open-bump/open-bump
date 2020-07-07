import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.4.1",
  up: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "sblpSandbox" Column To "Application" */
      await queryInterface.addColumn(
        "Application",
        "sblpSandbox",
        datatypes.BOOLEAN,
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

      /* Remove "sblpSandbox" Column From "Application" */
      await queryInterface.removeColumn("Application", "sblpSandbox", {
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
