import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
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

  public async run(
    { message, arguments: args }: ParsedMessage,
    guildDatabase: Guild
  ) {
    const { channel, author } = message;
    const userDatabase = await User.findOne({
      where: { id: author.id },
      include: [{ model: Donator, include: [AssignedTier.scope("default")] }]
    });

    if (userDatabase?.donator && args.length === 0) {
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
          `Manage your pledge at **[Patreon](https://www.patreon.com/Looat)**.`;

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
              `- \`ob!premium activate <tier...>\` - Activate Premium on this server\n` +
              `- \`ob!premium deactivate [serverId]\` - Deactivate Premium\n` +
              `- \`ob!premium tiers\` - List all tiers`
          }
        ]
      };
      return void (await channel.send({ embed }));
    } else if (!userDatabase?.donator && args.length === 0) {
      return void message.channel.send("TODO");
    } else if (
      args.length === 1 &&
      (args[0] === "tiers" || args[0] === "list")
    ) {
      const premiumTiers = await PremiumTier.findAll();
      const embed = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.INFORMATION} Premium Tiers`,
        description:
          "This is a list of all tiers. Use the command `ob!premium activate <tier...>` to activate premium on this server.",
        fields: premiumTiers.map((premiumTier) => ({
          name: `${premiumTier.name} | ${premiumTier.cost} cents`,
          value: premiumTier.features
            .map((feature) => `- ${feature.feature}`)
            .join("\n")
        }))
      };
      return void message.channel.send({ embed });
    }
  }
}
