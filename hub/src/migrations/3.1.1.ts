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
        id: "c8a68353-31ee-47ee-8694-a533d2c8283f",
        name: "Basic Wumpus",
        cost: 100,
        cooldown: 30,
        features: ["PREFIX", "RESTRICTED_CHANNEL"]
      });

      await insertTier({
        id: "5d132b40-deed-4be2-ada9-c9704c391f48",
        name: "Classic Wumpus",
        cost: 300,
        cooldown: 30,
        features: ["PREFIX", "RESTRICTED_CHANNEL", "BANNER", "COLOR"]
      });

      await insertTier({
        id: "e890b016-4b97-43d3-963e-455501e8679b",
        name: "Nitro Wumpus",
        cost: 500,
        cooldown: 30,
        features: [
          "PREFIX",
          "RESTRICTED_CHANNEL",
          "BANNER",
          "COLOR",
          "AUTOBUMP"
        ]
      });

      await insertTier({
        id: "5a4cfedc-d51b-406b-9957-638832e287c2",
        name: "Booster Wumpus",
        cost: 800,
        cooldown: 15,
        features: [
          "PREFIX",
          "RESTRICTED_CHANNEL",
          "BANNER",
          "COLOR",
          "AUTOBUMP",
          "CROSS"
        ]
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
        "c8a68353-31ee-47ee-8694-a533d2c8283f",
        "5d132b40-deed-4be2-ada9-c9704c391f48",
        "e890b016-4b97-43d3-963e-455501e8679b",
        "5a4cfedc-d51b-406b-9957-638832e287c2"
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
