import { MigrationJS } from "./helpers/Migrator";

const migration: MigrationJS = {
  version: "3.2.0",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Create "Reminder" Table */
      await queryInterface.createTable(
        "Reminder",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          guildId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          userId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          channel: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          voted: {
            type: datatypes.BOOLEAN
          },
          createdAt: {
            defaultValue: connection.Sequelize.literal("CURRENT_TIMESTAMP"),
            allowNull: false,
            type: datatypes.DATE
          },
          updatedAt: {
            defaultValue: connection.Sequelize.literal("CURRENT_TIMESTAMP"),
            allowNull: false,
            type: datatypes.DATE
          }
        },
        { transaction, charset: "utf8mb4" }
      );

      // Create Unique Constraint
      await queryInterface.addConstraint("Reminder", ["guildId", "userId"], {
        type: "unique",
        name: "Reminder_guildId_userId_uk",
        transaction
      });

      // Add Foreign Key From "Reminder" To "Guild"
      await queryInterface.addConstraint("Reminder", ["guildId"], {
        type: "foreign key",
        name: "Reminder_guildId_Guild_fk",
        references: {
          table: "Guild",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });

      // Add Foreign Key From "Reminder" To "User"
      await queryInterface.addConstraint("Reminder", ["userId"], {
        type: "foreign key",
        name: "Reminder_userId_Guild_fk",
        references: {
          table: "User",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
  down: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Delete "Reminder" Table */
      await queryInterface.dropTable("Reminder", { transaction });

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
