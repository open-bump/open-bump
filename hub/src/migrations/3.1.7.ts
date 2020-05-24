import { MigrationJS } from "./helpers/Migrator";

const migration: MigrationJS = {
  version: "3.1.7",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "lastBumpedWith" Column To "Guild" */
      await queryInterface.addColumn(
        "Guild",
        "lastBumpedWith",
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
  down: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "lastBumpedWith" Column From "Guild" */
      await queryInterface.removeColumn("Guild", "lastBumpedWith", {
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
