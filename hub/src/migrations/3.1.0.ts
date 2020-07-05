import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.1.0",
  up: async (connection, datatypes) => {
    const transaction = await connection.transaction();
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

      /* Create "Donator" Table */
      await queryInterface.createTable(
        "Donator",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          userId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          patreon: {
            type: datatypes.INTEGER
          },
          bonus: {
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

      // Add Foreign Key From "Donator" To "User"
      await queryInterface.addConstraint("Donator", ["userId"], {
        type: "foreign key",
        name: "Donator_userId_User_fk",
        references: {
          table: "User",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });

      /* Create "PremiumTier" Table */
      await queryInterface.createTable(
        "PremiumTier",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          cost: {
            allowNull: false,
            type: datatypes.INTEGER
          },
          name: {
            allowNull: false,
            type: datatypes.STRING
          },
          cooldown: {
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

      /* Create "PremiumTierFeature" Table */
      await queryInterface.createTable(
        "PremiumTierFeature",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          premiumTierId: {
            allowNull: false,
            type: datatypes.UUID
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
      await queryInterface.addConstraint(
        "PremiumTierFeature",
        ["premiumTierId", "feature"],
        {
          type: "unique",
          name: "PremiumTierFeature_premiumTierId_feature_uk",
          transaction
        }
      );

      // Add Foreign Key From "PremiumTierFeature" To "PremiumTier"
      await queryInterface.addConstraint(
        "PremiumTierFeature",
        ["premiumTierId"],
        {
          type: "foreign key",
          name: "PremiumTierFeature_premiumTierId_PremiumTier_fk",
          references: {
            table: "PremiumTier",
            field: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          transaction
        }
      );

      /* Create "AssignedTier" Table */
      await queryInterface.createTable(
        "AssignedTier",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          donatorId: {
            allowNull: false,
            type: datatypes.UUID
          },
          guildId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          premiumTierId: {
            allowNull: false,
            type: datatypes.UUID
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

      // Add Foreign Key From "AssignedTier" To "Donator"
      await queryInterface.addConstraint("AssignedTier", ["donatorId"], {
        type: "foreign key",
        name: "AssignedTier_donatorId_Donator_fk",
        references: {
          table: "Donator",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });

      // Add Foreign Key From "AssignedTier" To "Guild"
      await queryInterface.addConstraint("AssignedTier", ["guildId"], {
        type: "foreign key",
        name: "AssignedTier_guildId_Guild_fk",
        references: {
          table: "Guild",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });

      // Add Foreign Key From "AssignedTier" To "PremiumTier"
      await queryInterface.addConstraint("AssignedTier", ["premiumTierId"], {
        type: "foreign key",
        name: "AssignedTier_premiumTierId_PremiumTier_fk",
        references: {
          table: "PremiumTier",
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
  down: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Delete "AssignedTier" Table */
      await queryInterface.dropTable("AssignedTier", { transaction });

      /* Delete "PremiumTierFeature" Table */
      await queryInterface.dropTable("PremiumTierFeature", { transaction });

      /* Delete "PremiumTier" Table */
      await queryInterface.dropTable("PremiumTier", { transaction });

      /* Delete "Donator" Table */
      await queryInterface.dropTable("Donator", { transaction });

      /* Delete "User" Table */
      await queryInterface.dropTable("User", { transaction });

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
