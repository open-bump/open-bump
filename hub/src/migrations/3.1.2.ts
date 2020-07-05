import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
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
        "transitionShard",
        {
          type: datatypes.STRING
        },
        { transaction }
      );

      /* Update all null balances to 0 */
      await queryInterface.bulkUpdate(
        "Donator",
        {
          patreon: 0
        },
        {
          patreon: null
        },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        "Donator",
        {
          bonus: 0
        },
        {
          bonus: null
        },
        { transaction }
      );

      /* Set default value to 0 for amount columns */
      await queryInterface.changeColumn(
        "Donator",
        "patreon",
        {
          type: datatypes.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "Donator",
        "bonus",
        {
          type: datatypes.INTEGER,
          defaultValue: 0,
          allowNull: false
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
