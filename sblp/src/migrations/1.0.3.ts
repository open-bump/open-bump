import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "1.0.3",
  up: async (connection, datatypes) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Create "User" Table */
      await queryInterface.createTable(
        "User",
        {
          id: {
            primaryKey: true,
            allowNull: false,
            type: datatypes.STRING(20)
          },
          accessToken: datatypes.STRING,
          refreshToken: datatypes.STRING,
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

      /* Add "userId" Column To "Application" Table */
      await queryInterface.addColumn(
        "Application",
        "userId",
        datatypes.STRING(20),
        { transaction }
      );

      // Add Foreign Key From "Application" To "User"
      await queryInterface.addConstraint("Application", ["userId"], {
        type: "foreign key",
        name: "Application_userId_User_fk",
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
  down: async (connection: Sequelize) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Remove "userId" Column From "Application" Table */
      await queryInterface.removeColumn("Application", "userId", {
        transaction
      });

      /* Delete "User" Table */
      await queryInterface.dropTable("User", { transaction });

      await transaction.commit();
    } catch (error) {
      console.error("Error in migration, rolling back...");
      await transaction.rollback();
      throw error;
    }
  }
};

export default migration;
