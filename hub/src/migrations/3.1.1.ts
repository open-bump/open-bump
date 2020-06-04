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
        name: "Wumpus",
        cost: 100,
        features: ["COLOR", "BANNER", "PREFIX", "FEATURED", "CROSS"]
      });

      await insertTier({
        id: "d502d010-925e-4342-ba97-9d001fb35dbe",
        name: "Boxer",
        cost: 300,
        features: ["AUTOBUMP", "PREFIX", "CROSS"]
      });

      await insertTier({
        id: "215f4d85-e53e-4fd3-8657-31b46562b63c",
        name: "Cool Wumpus",
        cost: 500,
        features: ["COLOR", "BANNER", "PREFIX", "FEATURED", "AUTOBUMP", "CROSS"]
      });

      await insertTier({
        id: "ebc8ce5c-1034-4af1-868b-582c20ef95e8",
        name: "Fast Boxer",
        cost: 500,
        cooldown: 15,
        features: ["PREFIX", "AUTOBUMP", "CROSS"]
      });

      await insertTier({
        id: "dd6328b3-7d54-41f3-8c63-39d350a55cc1",
        name: "Super Wumpus",
        cost: 700,
        cooldown: 15,
        features: ["COLOR", "BANNER", "PREFIX", "FEATURED", "AUTOBUMP", "CROSS"]
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
        "d502d010-925e-4342-ba97-9d001fb35dbe",
        "215f4d85-e53e-4fd3-8657-31b46562b63c",
        "ebc8ce5c-1034-4af1-868b-582c20ef95e8",
        "dd6328b3-7d54-41f3-8c63-39d350a55cc1"
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
