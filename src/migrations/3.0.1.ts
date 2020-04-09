import { DataType, Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import { MigrationJS } from "./helpers/Migrator";

const migration: MigrationJS = {
  version: "3.0.1",
  up: async (connection, datatypes) => {
    const transaction: Transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Create "Guild" Table */
      await queryInterface.createTable(
        "Guild",
        {
          id: {
            primaryKey: true,
            allowNull: false,
            type: datatypes.STRING(20)
          },
          name: datatypes.STRING,
          feed: datatypes.STRING(20),
          autobump: datatypes.BOOLEAN,
          lastBumpedBy: datatypes.STRING(20),
          lastBumpedAt: datatypes.DATE,
          totalBumps: {
            defaultValue: 0,
            allowNull: false,
            type: datatypes.INTEGER
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

      /* Create "GuildFeature" Table */
      await queryInterface.createTable(
        "GuildFeature",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          guild: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          feature: {
            allowNull: false,
            type: datatypes.STRING(100)
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
      await queryInterface.addConstraint("GuildFeature", ["guild", "feature"], {
        type: "unique",
        name: "GuildFeature_guild_feature_uk",
        transaction
      });

      // Add Foreign Key From "GuildFeature" To "Guild"
      await queryInterface.addConstraint("GuildFeature", ["guild"], {
        type: "foreign key",
        name: "GuildFeature_guild_Guild_fk",
        references: {
          table: "Guild",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      });

      /* Create "BumpData" Table */
      await queryInterface.createTable(
        "BumpData",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          guildId: datatypes.STRING(20),
          description: DataType.TEXT,
          invite: DataType.STRING,
          banner: DataType.STRING,
          color: DataType.INTEGER,
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

      // Add Foreign Key From "BumpData" To "Guild"
      await queryInterface.addConstraint("BumpData", ["guildId"], {
        type: "foreign key",
        name: "BumpData_guildId_Guild_fk",
        references: {
          table: "Guild",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });
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

      /* Delete "BumpData" Table */
      await queryInterface.dropTable("BumpData", { transaction });

      /* Delete "GuildFeature" Table */
      await queryInterface.dropTable("GuildFeature", { transaction });

      /* Delete "Guild" Table */
      await queryInterface.dropTable("Guild", { transaction });
    } catch (error) {
      console.error("Error in migration, rolling back...");
      await transaction.rollback();
      throw error;
    }
  }
};

export default migration;
