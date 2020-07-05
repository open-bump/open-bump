import { Migratable } from "./helpers/Migrator";

const migration: Migratable = {
  version: "3.4.0",
  up: async (connection, datatypes) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Update "lastBumpedWith" column in "Guild" table */
      await queryInterface.changeColumn(
        "Guild",
        "lastBumpedWith",
        datatypes.STRING(36)
      );

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
          name: {
            allowNull: false,
            type: datatypes.STRING
          },
          userId: {
            allowNull: false,
            type: datatypes.STRING(20)
          },
          token: {
            defaultValue: datatypes.UUIDV4,
            allowNull: false,
            type: datatypes.UUID
          },
          bot: {
            type: datatypes.STRING(20)
          },
          sblpEnabled: {
            type: datatypes.BOOLEAN
          },
          sblpBase: {
            type: datatypes.STRING
          },
          sblpAuthorization: {
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

      /* Create "ApplicationFeature" Table */
      await queryInterface.createTable(
        "ApplicationFeature",
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
        "ApplicationFeature",
        ["applicationId", "feature"],
        {
          type: "unique",
          name: "ApplicationFeature_applicationId_feature_uk",
          transaction
        }
      );

      // Add Foreign Key From "ApplicationFeature" To "Application"
      await queryInterface.addConstraint(
        "ApplicationFeature",
        ["applicationId"],
        {
          type: "foreign key",
          name: "ApplicationFeature_applicationId_Application_fk",
          references: {
            table: "Application",
            field: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          transaction
        }
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

      /* Delete "ApplicationFeature" Table */
      await queryInterface.dropTable("ApplicationFeature", { transaction });

      /* Delete "Application" Table */
      await queryInterface.dropTable("Application", { transaction });

      /* Update "lastBumpedWith" column in "Guild" table */
      await queryInterface.changeColumn(
        "Guild",
        "lastBumpedWith",
        datatypes.STRING(20)
      );

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
