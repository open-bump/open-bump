import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import AssignedTier from "./models/AssignedTier";
import Donator from "./models/Donator";
import PremiumTier from "./models/PremiumTier";
import OpenBump from "./OpenBump";
import Utils from "./Utils";
import config from "./config";
import moment from "moment";

export default class Premium {
  constructor(private instance: OpenBump) {}

  public async init() {
    await this.premiumLoop();
  }

  private async premiumLoop() {
    console.log("Running premium loop...");

    const violators = await Donator.findAll({
      attributes: {
        include: [
          [
            Sequelize.fn(
              "SUM",
              Sequelize.col("assignedTiers.premiumTier.cost")
            ),
            "totalAssigned"
          ],
          [Sequelize.literal("patreon + bonus"), "totalBalance"]
        ]
      },
      group: "userId",
      include: [
        {
          model: AssignedTier,
          attributes: ["premiumTierId"],
          required: true,
          include: [
            {
              model: PremiumTier.scope(""),
              attributes: ["cost"],
              required: true
            }
          ]
        }
      ],
      where: {
        "$assignedTiers.premiumTier.cost$": {
          [Op.gt]: 0
        }
      },
      having: {
        totalAssigned: {
          [Op.gt]: Sequelize.col("totalBalance")
        }
      },
      logging: console.log
    });

    for (const violator of violators) {
      if (!violator.transitionStartedAt) {
        // No transition started yet
        violator.set("transitionStartedAt", new Date());

        try {
          const user = await this.instance.client.users.fetch(violator.userId);
          const embed = {
            color: Utils.Colors.RED,
            title: `${Utils.Emojis.XMARK} Payment issue`,
            description:
              "Hey there, we recently detected a problem with your premium. " +
              "It looks like your balance is not enough to cover the cost for all activated servers. " +
              "Please fix this issue asap." +
              "You can increate your pledge or disable/change change servers. " +
              "To get an overview of your activated premium servers, use the command `ob!premium` to do so. " +
              "Please note, the premium command needs to be executed on your own server and not via DMs. " +
              `If you believe this is an error, please contact **[Support](${config.settings.support})**.`
          };
          await user.send({ embed });
          violator.transitionStartInformed = true;
        } catch (error) {
          violator.transitionStartInformed = false;
        }
        await violator.save();
      } else if (violator.transitionStartedAt) {
        if (
          moment(violator.transitionStartedAt).isBefore(
            moment().subtract(1, "m")
          )
        ) {
            // Transition due

            // TODO: Current position.
            //       Handle due transitions.
          } else if (!violator.transitionStartInformed) {
          // Transition not due, but not yet informed
          try {
            const user = await this.instance.client.users.fetch(
              violator.userId
            );
            const embed = {
              color: Utils.Colors.RED,
              title: `${Utils.Emojis.XMARK} Payment issue`,
              description:
                "Hey there, we recently detected a problem with your premium. " +
                "It looks like your balance is not enough to cover the cost for all activated servers. " +
                "Please fix this issue asap." +
                "You can increate your pledge or disable/change change servers. " +
                "To get an overview of your activated premium servers, use the command `ob!premium` to do so. " +
                "Please note, the premium command needs to be executed on your own server and not via DMs. " +
                `If you believe this is an error, please contact **[Support](${config.settings.support})**.`
            };
            await user.send({ embed });
            violator.transitionStartInformed = true;
          } catch (error) {
            violator.transitionStartInformed = false;
          }
          if (violator.changed()) await violator.save();
        }
      }
    }

    // Only for debug reasons
    console.log(
      violators.map(
        (violator) =>
          `${violator.userId}:${violator.get("totalAssigned")}/${violator.get(
            "totalBalance"
          )}`
      )
    );

    setTimeout(this.premiumLoop.bind(this), 1000 * 60);
  }
}
