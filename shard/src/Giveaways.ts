import Discord, { MessageEmbedOptions } from "discord.js";
import Giveaway from "./models/Giveaway";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";
import Utils from "./Utils";

export interface RequirementData {
  type: "GUILD" | "ROLE" | "VOTE";
  target?: string;
  invite?: string;
}

export default class Giveaways {
  public static async start(
    guild: Discord.Guild,
    channel: Discord.TextChannel,
    prize: string,
    time: number,
    winnersCount: number,
    requirements: Array<RequirementData> = []
  ) {
    const channelPermissions = channel.permissionsFor(
      String(OpenBump.instance.client.user?.id)
    ); // TODO: Check permissions

    let description = [`React with ${Utils.Emojis.TADA} to enter!`];

    if (winnersCount !== 1) description.push(`Winners: **${winnersCount}**`);

    for (const requirement of requirements) {
      if (requirement.type === "GUILD") {
        const requirementGuildDatabase = await Guild.findOne({
          where: { id: requirement.target as string }
        });
        if (!requirement) return; // TODO: Throw error
        description.push(
          `Must join: **[${requirementGuildDatabase?.name}](${requirement.invite})**`
        );
      } else if (requirement.type === "ROLE") {
        const role = guild.roles.fetch(requirement.target);
        if (!role) return; // TODO: Throw error
        description.push(`Must have role: ${role}`);
      } else if (requirement.type === "VOTE")
        description.push(
          `Must vote for: **[${
            OpenBump.instance.client.user?.username
          }](${Utils.Lists.getLinkTopGG()})**`
        );
      else return; // TODO: Throw error
    }

    const embed: MessageEmbedOptions = {
      color: Utils.Colors.GREEN,
      title: `${Utils.Emojis.GIFT} ${prize}`,
      description: description.join("\n"),
      footer: {
        text: `${winnersCount} Winner${winnersCount === 1 ? "" : "s"} | Ends at`
      },
      timestamp: Date.now() // TODO: Use correct date
    };

    // TODO: Add permission checks somewhere and have error handling
    const message = await channel.send({ embed });

    const giveawayDatabase = await Giveaway.create({
      id: message.id,
      guildId: guild.id,
      channel: channel.id,
      prize,
      time,
      winnersCount
    });

    for (const requirement of requirements) {
      await giveawayDatabase.$create("requirements", {
        type: requirement.type,
        target: requirement.target,
        invite: requirement.invite
      });
    }
  }
}
