import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import AssignedTier from "./models/AssignedTier";
import Donator from "./models/Donator";
import PremiumTier from "./models/PremiumTier";
import OpenBump from "./OpenBump";

export default class Premium {
  constructor(private instance: OpenBump) {}

  public async init() {
    await this.premiumLoop();
  }

  private async premiumLoop() {
    console.log("Running premium loop...");

    const donators = await Donator.findAll({
      attributes: [
        "userId",
        [
          Sequelize.fn("SUM", Sequelize.col("assignedTiers.premiumTier.cost")),
          "totalAssigned"
        ],
        [Sequelize.literal('patreon + bonus'), 'totalBalance']
      ],
      group: "userId",
      include: [{ model: AssignedTier, attributes:['premiumTierId'], required: true, include: [{ model: PremiumTier.scope(''), attributes: ['cost'], required: true }] }],
      where: {
        "$assignedTiers.premiumTier.cost$": {
          [Op.gt]: 0
        },
      },
      logging: console.log
    });

    console.log(
      donators.map((donator) => `${donator.userId}:${donator.get('totalAssigned')}/${donator.get("totalBalance")}`)
    );

    // TODO: Current position.
    //       Start transition and inform donators with insufficient balance.
    //       The query above needs to be improved as it only is for testing purposes.
    //       The total balance the user has currently is null when either patreon or bonus is null.
    //       A migration that sets all null values and the default value to 0, fixes that.

    setTimeout(this.premiumLoop.bind(this), 1000 * 60);
  }
}
