import moment from "moment";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import config from "./config";
import AssignedTier from "./models/AssignedTier";
import Donator from "./models/Donator";
import Guild from "./models/Guild";
import PremiumTier from "./models/PremiumTier";
import OpenBump from "./OpenBump";
import Utils from "./Utils";

export default class Premium {
  constructor(private instance: OpenBump) {}

  public async init() {
    await this.premiumLoop();
  }

  private async premiumLoop() {
    console.log("Running premium loop...");
    // TODO: Make sure there are no conflicts with other shards checking premiums at the same time

    // Go through donators where nitro boost informed state is different
    const recents = await Donator.findAll({
      where: {
        nitroBoost: { [Op.ne]: Sequelize.col("nitroBoostInformed") }
      }
    });

    const boosterGuild = config.settings.nitroboost?.server
      ? await Guild.findOne({
          where: { id: config.settings.nitroboost?.server }
        })
      : null;

    for (const recent of recents) {
      const enabled = recent.nitroBoost;
      try {
        recent.nitroBoostInformed = recent.nitroBoost;
        if (recent.changed()) await recent.save();
        const user = await this.instance.client.users.fetch(recent.userId);
        const embed = {
          color: enabled ? Utils.Colors.GREEN : Utils.Colors.ORANGE,
          title: enabled
            ? `${Utils.Emojis.CHECK} Boost power activated`
            : `${Utils.Emojis.IMPORTANTNOTICE} Boost power deactivated`,
          description: enabled
            ? `Hey there, thank you for boosting ${
                boosterGuild?.name || "our server"
              }. ` +
              `As a thank you, you have received a bonus of ${Utils.formatCurrency(
                config.settings.nitroboost?.bonus || 0
              )} to use with ${
                this.instance.client.user?.username || "this bot"
              }. ` +
              `To start using it, use the command \`${Utils.getPrefix()}premium\` in your server. ` +
              `It will tell you more information about how to use your boost power.`
            : `Hey there, we noticed you removed your boost from ${
                boosterGuild?.name || "our server"
              }. ` +
              `Please note that you lost your bonus of ${Utils.formatCurrency(
                config.settings.nitroboost?.bonus || 0
              )}. ` +
              `In case of a negative account balance, you may recieve further messages from this bot.`
        };
        await user.send({ embed });
      } catch (error) {}
    }

    // Go through new and current violators
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
          [
            Sequelize.literal(
              `\`patreon\` + \`bonus\` + case when \`nitroBoost\` = 1 then ${
                config.settings.nitroboost?.bonus || 0
              } else 0 end`
            ),
            "totalBalance"
          ]
        ]
      },
      group: "userId",
      include: [
        {
          model: AssignedTier,
          attributes: ["id", "premiumTierId"],
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
      }
    });

    for (const violator of violators) {
      if (!violator.transitionStartedAt) {
        // No transition started yet
        violator.set("transitionStartedAt", new Date());

        try {
          const user = await this.instance.client.users.fetch(violator.userId);
          const embed = {
            color: Utils.Colors.ORANGE,
            title: `${Utils.Emojis.IMPORTANTNOTICE} Payment issue`,
            description:
              "Hey there, we recently detected a problem with your premium. " +
              "It looks like your balance is not enough to cover the cost for all activated servers. " +
              "Please fix this issue asap. " +
              "You can increase your pledge or disable/change change servers. " +
              `To get an overview of your activated premium servers, use the command \`${Utils.getPrefix()}premium\` to do so. ` +
              "Please note, the premium command needs to be executed on your own server and not via DMs. " +
              `If you believe this is an error, please contact **[Support](${config.settings.support})**.\n` +
              `\n` +
              `**Current Balance:** ${Utils.formatCurrency(
                violator.get("totalBalance") as number
              )}\n` +
              `**Required Balance:** ${Utils.formatCurrency(
                violator.get("totalAssigned") as number
              )}`
          };
          await user.send({ embed });
          violator.transitionStartInformed = true;
        } catch (error) {
          violator.transitionStartInformed = false;
        }
        if (violator.changed()) await violator.save();
      } else if (
        violator.transitionStartedAt &&
        moment(violator.transitionStartedAt).isBefore(moment().subtract(3, "d"))
      ) {
        // Transition due
        await AssignedTier.destroy({ where: { donatorId: violator.id } });

        try {
          const user = await this.instance.client.users.fetch(violator.userId);
          const embed = {
            color: Utils.Colors.RED,
            title: `${Utils.Emojis.XMARK} Premium deactivated`,
            description:
              "Hey there, this is a notice that your premium has been deactivated. " +
              "This happened because your balance was not able to cover all activated servers for 3 days. " +
              "All of your premium activations have been disabled." +
              `If you believe this is an error, please contact **[Support](${config.settings.support})**.`
          };
          await user.send({ embed });
          violator.transitionStartedAt = null;
          violator.transitionStartInformed = null;
          violator.transitionFixedAt = null;
          violator.transitionEndedAt = null;
        } catch (error) {
          violator.transitionEndedAt = new Date();
        }
        if (violator.changed()) await violator.save();
      } else if (
        violator.transitionStartedAt &&
        !violator.transitionStartInformed
      ) {
        // Transition not due, but not yet informed
        try {
          const user = await this.instance.client.users.fetch(violator.userId);
          const embed = {
            color: Utils.Colors.ORANGE,
            title: `${Utils.Emojis.IMPORTANTNOTICE} Payment issue`,
            description:
              "Hey there, we recently detected a problem with your premium. " +
              "It looks like your balance is not enough to cover the cost for all activated servers. " +
              "Please fix this issue asap. " +
              "You can increase your pledge or disable/change change servers. " +
              `To get an overview of your activated premium servers, use the command \`${Utils.getPrefix()}premium\` to do so. ` +
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

    // Go through resolved violators
    const exs = await Donator.findAll({
      attributes: {
        include: [
          [
            Sequelize.fn(
              "SUM",
              Sequelize.col("assignedTiers.premiumTier.cost")
            ),
            "totalAssigned"
          ],
          [
            Sequelize.literal(
              `\`patreon\` + \`bonus\` + case when \`nitroBoost\` = 1 then ${
                config.settings.nitroboost?.bonus || 0
              } else 0 end`
            ),
            "totalBalance"
          ]
        ]
      },
      group: "userId",
      include: [
        {
          model: AssignedTier,
          attributes: ["id", "premiumTierId"],
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
        transitionStartedAt: {
          [Op.ne]: null
        }
      },
      having: {
        totalAssigned: {
          [Op.lte]: Sequelize.col("totalBalance")
        }
      }
    });

    for (const ex of exs) {
      if (!ex.transitionFixedAt) ex.transitionFixedAt = new Date();

      try {
        const user = await this.instance.client.users.fetch(ex.userId);
        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Issue resolved`,
          description:
            "Hey there, we recently detected a problem with your premium. " +
            "However, it looks like the issue has been resolved and we removed the entry from our database. " +
            "Thank you for your support!"
        };
        await user.send({ embed });
        ex.transitionStartedAt = null;
        ex.transitionStartInformed = null;
        ex.transitionFixedAt = null;
        ex.transitionEndedAt = null;
      } catch (error) {
        ex.transitionStartedAt = null;
        ex.transitionStartInformed = null;
        ex.transitionEndedAt = null;
        ex.transitionFixedAt = new Date();
      }
      if (ex.changed()) await ex.save();
    }

    // Output for debug reasons
    console.log(
      "violators",
      violators.map(
        (violator) =>
          `${violator.userId}:${violator.get("totalAssigned")}/${violator.get(
            "totalBalance"
          )}`
      )
    );
    console.log(
      "exs",
      exs.map(
        (ex) =>
          `${ex.userId}:${ex.get("totalAssigned")}/${ex.get("totalBalance")}`
      )
    );

    setTimeout(this.premiumLoop.bind(this), 1000 * 60);
  }
}
