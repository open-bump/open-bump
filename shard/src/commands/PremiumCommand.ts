import { ParsedMessage } from "discord-command-parser";
import { Op } from "sequelize";
import Command from "../Command";
import config from "../config";
import AssignedTier from "../models/AssignedTier";
import Donator from "../models/Donator";
import Guild from "../models/Guild";
import PremiumTier from "../models/PremiumTier";
import User from "../models/User";
import Utils from "../Utils";

export default class PremiumCommand extends Command {
  public name = "premium";
  public aliases = ["patreon", "donate", "donator"];
  public syntax = "premium [tiers|activate <tier...>|deactivate [serverId]]";
  public description = "View information about and manage your premium";
  public general = true;

  public async run(
    { message, arguments: args }: ParsedMessage,
    guildDatabase: Guild
  ) {
    const { channel, author, guild } = message;
    const userDatabase = await User.findOne({
      where: { id: author.id },
      include: [
        {
          model: Donator,
          include: [AssignedTier.scope("default")]
        }
      ]
    });

    if (
      userDatabase?.donator &&
      !userDatabase.donator.patreon &&
      !userDatabase.donator.bonus &&
      (!userDatabase.donator.assignedTiers ||
        userDatabase.donator.assignedTiers.length === 0)
    )
      userDatabase.donator = undefined;

    if (
      userDatabase?.donator &&
      (args.length === 0 || (args.length === 1 && args[0] === "view"))
    ) {
      const totalBalance =
        userDatabase.donator.patreon + userDatabase?.donator.bonus;
      const totalAssigned = userDatabase.donator.assignedTiers
        .map((assigned) => assigned.premiumTier.cost)
        .reduce((acc, cur) => acc + cur, 0);

      let description =
        `**Total Balance:** ${totalBalance} cents\n` +
        `**Balance Used:** ${totalAssigned} cents`;

      if (userDatabase.donator.patreon)
        description +=
          `\n\n` +
          `Manage your pledge at **[Patreon](${config.settings.patreon})**.`;

      const prefix = Utils.getPrefix(guildDatabase);

      const embed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.INFORMATION} Premium Overview`,
        description,
        fields: [
          ...userDatabase.donator.assignedTiers.map((assigned) => {
            return {
              name: `${assigned.guild.name} | ${assigned.guildId}`,
              value:
                `**Tier:** ${assigned.premiumTier.name}\n` +
                `**Cost:** ${assigned.premiumTier.cost} cents`
            };
          }),
          {
            name: "Syntax",
            value:
              `- \`${prefix}premium activate <tier...>\` - Activate Premium on this server\n` +
              `- \`${prefix}premium deactivate [serverId]\` - Deactivate Premium\n` +
              `- \`${prefix}premium tiers\` - List all tiers`
          }
        ]
      };
      return void (await channel.send({ embed }));
    } else if (!userDatabase?.donator && args.length === 0) {
      const embed = {
        color: Utils.Colors.ORANGE,
        title: `${Utils.Emojis.FEATURED} Premium`,
        description:
          `Premium allows you to use additional features and commands. You can buy Premium from Patreon by using the link below:\n` +
          `${config.settings.patreon}\n` +
          `\n` +
          `To view a list of all available tiers, please use the command \`${Utils.getPrefix(
            guildDatabase
          )}premium tiers\`.`,
        fields: [
          {
            name: `${Utils.Emojis.EXCLAMATION} You are not a Donator`,
            value: `If you recently became a Donator, it might take up to 5 minutes until you can activate premium for your server.`
          }
        ]
      };
      return void (await channel.send({ embed }));
    } else if (
      args.length === 1 &&
      (args[0] === "tiers" || args[0] === "list")
    ) {
      const premiumTiers = await PremiumTier.findAll({
        order: ["cost"]
      });
      const embed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.INFORMATION} Premium Tiers`,
        description: `This is a list of all tiers. Use the command \`${Utils.getPrefix(
          guildDatabase
        )}premium activate <tier...>\` to activate premium on this server.`,
        fields: premiumTiers.map((premiumTier) => ({
          name: `${premiumTier.name} | ${premiumTier.cost} cents`,
          value: premiumTier.features
            .map((feature) => `- ${feature.feature}`)
            .join("\n")
        }))
      };
      return void message.channel.send({ embed });
    } else if (
      userDatabase?.donator &&
      args.length >= 1 &&
      args.length <= 2 &&
      (args[0] === "deactivate" || args[0] === "disable")
    ) {
      const targetId = args.length === 2 ? args[1] : guild.id;

      const assignedTier = userDatabase.donator.assignedTiers.find(
        (tier) => tier.guildId === targetId
      );
      if (assignedTier) {
        await assignedTier.destroy();
        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Premium deactivated`,
          description: `You have successfully deactivated premium for guild "${
            assignedTier.guild.name || assignedTier.guildId
          }".`
        };
        return void (await channel.send({ embed }));
      } else {
        const targetDatabase = await Guild.findOne({
          where: { id: targetId }
        });

        const embed = {
          color: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} Premium not activated`,
          description: `You do not have premium activated for guild "${
            targetDatabase?.name || targetId
          }".`
        };
        return void (await channel.send({ embed }));
      }
    } else if (
      userDatabase?.donator &&
      args.length >= 2 &&
      (args[0] === "activate" || args[0] === "enable")
    ) {
      const search = args.slice(1).join(" ");
      const tier = await PremiumTier.findOne({
        where: {
          name: {
            [Op.like]: Utils.escapeLike(search)
          }
        }
      });
      if (tier) {
        const totalBalance =
          userDatabase.donator.patreon + userDatabase?.donator.bonus;
        const totalAssignedOthers = userDatabase.donator.assignedTiers
          .filter((assigned) => assigned.guildId !== guild.id)
          .map((assigned) => assigned.premiumTier.cost)
          .reduce((acc, cur) => acc + cur, 0);
        if (totalBalance >= totalAssignedOthers + tier.cost) {
          // Can afford tier
          for (const assignedTier of userDatabase.donator.assignedTiers)
            if (assignedTier.guildId === guild.id) await assignedTier.destroy();

          await AssignedTier.create({
            donatorId: userDatabase.donator.id,
            guildId: guild.id,
            premiumTierId: tier.id
          });

          const embed = {
            color: Utils.Colors.GREEN,
            title: `${Utils.Emojis.CHECK} Premium activated`,
            description: `You have successfully activated ${tier.name} for ${guild.name}. If this server had premium activated before, it will only be using the new tier now.`
          };
          return void (await channel.send({ embed }));
        } else {
          const embed = {
            color: Utils.Colors.RED,
            title: `${Utils.Emojis.XMARK} Insufficient balance`,
            description:
              `Your balance is not able to cover the cost for the ${tier.name} tier.\n` +
              `The tier costs ${tier.cost} cents but you only have ${
                totalBalance - totalAssignedOthers
              } cents left for this server.\n` +
              `Get an overview of your currently activated servers using \`${Utils.getPrefix(
                guildDatabase
              )}premium\`.`
          };
          return void (await channel.send({ embed }));
        }
      } else {
        const embed = {
          color: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} Tier not found`,
          description:
            `Could not find tier \`${search}\`.\n` +
            `Use the command \`${Utils.getPrefix(
              guildDatabase
            )}premium tiers\` to get a list of all tiers.`
        };
        return void (await channel.send({ embed }));
      }
    } else {
      return void (await this.sendSyntax(message, guildDatabase));
    }
  }
}
