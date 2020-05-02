import { MigrationJS } from "./helpers/Migrator";

const migration: MigrationJS = {
  version: "3.1.1",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      /* Insert Default Premium Tiers */
      interface ITier {
        id: string;
        name: string;
        cost: number;
        cooldown?: number;
        features: Array<string>;
      }

      async function insertTier(data: ITier) {
        await queryInterface.bulkInsert(
          "PremiumTier",
          [
            {
              id: data.id,
              name: data.name,
              cost: data.cost,
              cooldown: data.cooldown
            }
          ],
          { transaction }
        );
        if (data.features?.length) {
          await queryInterface.bulkInsert(
            "PremiumTierFeature",
            data.features.map((feature) => ({
              id: require("uuid").v4(),
              premiumTierId: data.id,
              feature: feature
            })),
            { transaction }
          );
        }
      }

      await insertTier({
        id: "122ca791-b19e-4c69-9e06-4554dfcaff67",
        name: "Bronze",
        cost: 400,
        cooldown: 20,
        features: ["COLOR", "BANNER", "PREFIX", "FEATURED", "CROSS", "AUTOBUMP"]
      });

      await insertTier({
        id: "d502d010-925e-4342-ba97-9d001fb35dbe",
        name: "Gold",
        cost: 600,
        cooldown: 10,
        features: ["COLOR", "BANNER", "PREFIX", "FEATURED", "CROSS", "AUTOBUMP"]
      });

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

      /* Delete Default Premium Tiers */
      const defaultTiers = [
        "122ca791-b19e-4c69-9e06-4554dfcaff67",
        "d502d010-925e-4342-ba97-9d001fb35dbe"
      ];

      await queryInterface.bulkDelete(
        "PremiumTier",
        {
          id: {
            [op.in]: defaultTiers
          }
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
  }
};

export default migration;
