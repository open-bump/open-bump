import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import AssignedTier from "../models/AssignedTier";
import Donator from "../models/Donator";
import Guild from "../models/Guild";
import User from "../models/User";
import Utils from "../Utils";

export default class PremiumCommand extends Command {
  public name = "premium";
  public aliases = ["patreon", "donate", "donator"];
  public syntax = "premium [tiers|activate <tier>]";
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

    if (userDatabase?.donator) {
      if (args.length === 0) {
        const totalBalance =
          userDatabase.donator.patreon + userDatabase?.donator.bonus;
        const totalAssigned = userDatabase.donator.assignedTiers
          .map((assigned) => assigned.premiumTier.cost)
          .reduce((acc, cur) => acc + cur, 0);

        const embed = {
          color: Utils.Colors.BLUE,
          title: `${Utils.Emojis.INFORMATION} Premium Overview`,
          description:
            `**Total Balance:** ${totalBalance} cents\n` +
            `**Balance Used:** ${totalAssigned} cents\n` +
            `\n` +
            `__**Assigned servers**__\n` +
            (userDatabase.donator.assignedTiers
              .map((assigned) => {
                return (
                  `**Server:** ${assigned.guild.name} (${assigned.guildId})\n` +
                  `**Tier:** ${assigned.premiumTier.name}`
                );
              })
              .join("\n\n") || "*No assigned servers*"),
          fieldsd: userDatabase.donator.assignedTiers.map((assigned) => {
            return {
              name: `${assigned.guild.name} | ${assigned.guildId}`,
              value: `**${assigned.premiumTier.name}:** ${assigned.premiumTier.cost} cents`
            };
          }),
          fields: [
            {
              name: "Syntax",
              value:
                `- \`ob!premium activate <tier>\` - Activate Premium on this server\n` +
                `- \`ob!premium deactivate [server]\` - Deactivate Premium\n` +
                `- \`ob!premium tiers\` - List all tiers`
            }
          ]
        };
        await channel.send({ embed });
      }
    } else {
      return void message.channel.send("TODO");
    }
  }
}
