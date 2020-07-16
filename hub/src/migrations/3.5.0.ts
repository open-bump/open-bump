import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.5.0",
  up: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "shareEnabled" Column To "Application" */
      await queryInterface.addColumn(
        "Application",
        "shareEnabled",
        datatypes.BOOLEAN,
        { transaction }
      );

      /* Rename Column "sblpAuthorization" To "authorization" In Table "Application" */
      await queryInterface.renameColumn(
        "Application",
        "sblpAuthorization",
        "authorization",
        {
          transaction
        }
      );

      /* Rename Column "sblpBase" To "base" In Table "Application" */
      await queryInterface.renameColumn("Application", "sblpBase", "base", {
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

      /* Rename Column "base" To "sblpBase" In Table "Application" */
      await queryInterface.renameColumn("Application", "base", "sblpBase", {
        transaction
      });

      /* Rename Column "authorization" To "sblpAuthorization" In Table "Application" */
      await queryInterface.renameColumn(
        "Application",
        "authorization",
        "sblpAuthorization",
        {
          transaction
        }
      );

      /* Remove "shareEnabled" Column From "Application" */
      await queryInterface.removeColumn("Application", "shareEnabled", {
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
