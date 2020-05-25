import { MigrationJS } from "./helpers/Migrator";

const migration: MigrationJS = {
  version: "3.1.8",
  up: async (connection, datatypes, op) => {
    const transaction = await connection.transaction();
    try {
      const queryInterface = connection.getQueryInterface();

      // Insert new features for tiers
      const tiers: { [id: string]: Array<string> } = {
        "c8a68353-31ee-47ee-8694-a533d2c8283f": ["PREMIUM"], // Basic Wumpus
        "5d132b40-deed-4be2-ada9-c9704c391f48": ["PREMIUM"], // Classic Wumpus
        "e890b016-4b97-43d3-963e-455501e8679b": ["PREMIUM"], // Nitro Wumpus
        "5a4cfedc-d51b-406b-9957-638832e287c2": ["PREMIUM", "BOOSTER_PREMIUM"] // Booster Wumpus
      };

      for (const tierId of Object.keys(tiers)) {
        const newFeatures = tiers[tierId];
        await queryInterface.bulkInsert(
          "PremiumTierFeature",
          newFeatures.map((feature) => ({
            id: require("uuid").v4(),
            premiumTierId: tierId,
            feature
          })),
          { transaction }
        );
      }

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

      /* Remove new features from tiers */
      await queryInterface.bulkDelete(
        "PremiumTierFeature",
        {
          feature: { [op.or]: ["PREMIUM", "BOOSTER_PREMIUM"] }
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
