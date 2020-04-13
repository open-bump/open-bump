import { MigrationJS } from "./helpers/Migrator";

const migration: MigrationJS = {
  version: "3.1.2",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Add Columns To "Donator" */
      await queryInterface.addColumn(
        "Donator",
        "transitionStartedAt",
        {
          type: datatypes.DATE
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Donator",
        "transitionStartInformed",
        {
          type: datatypes.BOOLEAN
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Donator",
        "transitionFixedAt",
        {
          type: datatypes.DATE
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Donator",
        "transitionEndedAt",
        {
          type: datatypes.DATE
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Donator",
        "transitionEndInformed",
        {
          type: datatypes.BOOLEAN
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Donator",
        "transitionShard",
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
  down: async (connection, _datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove Columns From "Donator" */
      await queryInterface.removeColumn("Donator", "transitionStartedAt", {
        transaction
      });
      await queryInterface.removeColumn("Donator", "transitionStartInformed", {
        transaction
      });
      await queryInterface.removeColumn("Donator", "transitionFixedAt", {
        transaction
      });
      await queryInterface.removeColumn("Donator", "transitionEndedAt", {
        transaction
      });
      await queryInterface.removeColumn("Donator", "transitionEndInformed", {
        transaction
      });
      await queryInterface.removeColumn("Donator", "transitionShard", {
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
