import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "1.0.0",
  up: async (connection, datatypes) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Create "Application" Table */
      await queryInterface.createTable(
        "Application",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          name: datatypes.STRING,
          bot: {
            unique: true,
            type: datatypes.STRING(20)
          },
          base: datatypes.STRING,
          token: {
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.STRING
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

      /* Create "ApplicationService" Table */
      await queryInterface.createTable(
        "ApplicationService",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          applicationId: {
            allowNull: false,
            type: datatypes.UUID
          },
          targetId: {
            allowNull: false,
            type: datatypes.UUID
          },
          token: datatypes.STRING,
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

      // Add Foreign Key From "ApplicationService" To "Application"
      await queryInterface.addConstraint(
        "ApplicationService",
        ["applicationId"],
        {
          type: "foreign key",
          name: "ApplicationService_applicationId_Application_fk",
          references: {
            table: "Application",
            field: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          transaction
        }
      );

      // Add Foreign Key From "ApplicationService" To "Application"
      await queryInterface.addConstraint("ApplicationService", ["targetId"], {
        type: "foreign key",
        name: "Service_targetId_Application_fk",
        references: {
          table: "Application",
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
  down: async (connection: Sequelize) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Delete "ApplicationService" Table */
      await queryInterface.dropTable("ApplicationService", { transaction });

      /* Delete "Application" Table */
      await queryInterface.dropTable("Application", { transaction });

      await transaction.commit();
    } catch (error) {
      console.error("Error in migration, rolling back...");
      await transaction.rollback();
      throw error;
    }
  }
};

export default migration;
