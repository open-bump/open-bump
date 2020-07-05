import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.3.0",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Create "Giveaway" Table */
      await queryInterface.createTable(
        "Giveaway",
        {
          id: {
            primaryKey: true,
            allowNull: false,
            type: datatypes.STRING(20)
          },
          guildId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          channel: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          prize: {
            allowNull: false,
            type: datatypes.STRING
          },
          time: {
            allowNull: false,
            type: datatypes.INTEGER
          },
          winnersCount: {
            allowNull: false,
            type: datatypes.INTEGER
          },
          endedAt: {
            type: datatypes.DATE
          },
          createdBy: {
            type: datatypes.STRING(20)
          },
          cancelledBy: {
            type: datatypes.STRING(20)
          },
          lastRefreshedAt: {
            defaultValue: connection.Sequelize.literal("CURRENT_TIMESTAMP"),
            allowNull: false,
            type: datatypes.DATE
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

      // Add Foreign Key From "Giveaway" To "Guild"
      await queryInterface.addConstraint("Giveaway", ["guildId"], {
        type: "foreign key",
        name: "Giveaway_guildId_Guild_fk",
        references: {
          table: "Guild",
          field: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        transaction
      });

      /* Create "GiveawayRequirement" Table */
      await queryInterface.createTable(
        "GiveawayRequirement",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          giveawayId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          type: {
            allowNull: false,
            type: datatypes.ENUM("GUILD", "ROLE", "VOTE")
          },
          target: {
            type: datatypes.STRING
          },
          invite: {
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

      // Add Foreign Key From "GiveawayRequirement" To "Giveaway"
      await queryInterface.addConstraint(
        "GiveawayRequirement",
        ["giveawayId"],
        {
          type: "foreign key",
          name: "GiveawayRequirement_giveawayId_Giveaway_fk",
          references: {
            table: "Giveaway",
            field: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          transaction
        }
      );

      /* Create "GiveawayParticipant" Table */
      await queryInterface.createTable(
        "GiveawayParticipant",
        {
          id: {
            primaryKey: true,
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          giveawayId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          userId: {
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

      // Create Unique Constraint
      await queryInterface.addConstraint(
        "GiveawayParticipant",
        ["giveawayId", "userId"],
        {
          type: "unique",
          name: "GiveawayParticipant_giveawayId_userId_uk",
          transaction
        }
      );

      // Add Foreign Key From "GiveawayParticipant" To "Giveaway"
      await queryInterface.addConstraint(
        "GiveawayParticipant",
        ["giveawayId"],
        {
          type: "foreign key",
          name: "GiveawayParticipant_giveawayId_Giveaway_fk",
          references: {
            table: "Giveaway",
            field: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          transaction
        }
      );

      // Add Foreign Key From "GiveawayParticipant" To "Giveaway"
      await queryInterface.addConstraint("GiveawayParticipant", ["userId"], {
        type: "foreign key",
        name: "GiveawayParticipant_userId_Giveaway_fk",
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

      /* Delete "GiveawayRequirement" Table */
      await queryInterface.dropTable("GiveawayRequirement", { transaction });

      /* Delete "GiveawayRequirement" Table */
      await queryInterface.dropTable("Giveaway", { transaction });

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
