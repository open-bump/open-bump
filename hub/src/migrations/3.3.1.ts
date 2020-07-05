import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.3.1",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add "lastBumpedAt" Column To "User" */
      await queryInterface.addColumn(
        "User",
        "lastBumpedAt",
        datatypes.STRING(20),
        { transaction }
      );

      /* Add "bumpsSinceCaptcha" Column To "User" */
      await queryInterface.addColumn(
        "User",
        "bumpsSinceCaptcha",
        { defaultValue: 0, allowNull: false, type: datatypes.INTEGER },
        { transaction }
      );

      /* Add "requireCaptcha" Column To "User" */
      await queryInterface.addColumn(
        "User",
        "requireCaptcha",
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
  down: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "lastBumpedAt" Column From "User" */
      await queryInterface.removeColumn("User", "lastBumpedAt", {
        transaction
      });

      /* Remove "bumpsSinceCaptcha" Column From "User" */
      await queryInterface.removeColumn("User", "bumpsSinceCaptcha", {
        transaction
      });

      /* Remove "requireCaptcha" Column From "User" */
      await queryInterface.removeColumn("User", "requireCaptcha", {
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
