import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.6.2",
  up: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "sblpBumpsSinceCaptcha" Column To "Guild" */
      await queryInterface.addColumn(
        "Guild",
        "sblpBumpsSinceCaptcha",
        { defaultValue: 0, allowNull: false, type: datatypes.INTEGER },
        { transaction }
      );

      /* Add "sblpRequireCaptcha" Column To "Guild" */
      await queryInterface.addColumn(
        "Guild",
        "sblpRequireCaptcha",
        { defaultValue: false, allowNull: false, type: datatypes.BOOLEAN },
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

      /* Remove "sblpBumpsSinceCaptcha" Column From "Guild" */
      await queryInterface.removeColumn("Guild", "sblpBumpsSinceCaptcha", {
        transaction
      });

      /* Remove "sblpRequireCaptcha" Column From "Guild" */
      await queryInterface.removeColumn("Guild", "sblpRequireCaptcha", {
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
