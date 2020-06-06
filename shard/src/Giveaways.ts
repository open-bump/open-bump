import Discord, { MessageEmbedOptions } from "discord.js";
import Giveaway from "./models/Giveaway";
import GiveawayRequirement from "./models/GiveawayRequirement";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";
import Utils, { TextBasedGuildChannel } from "./Utils";

export interface RequirementData {
  type: "GUILD" | "ROLE" | "VOTE";
  target?: string;
  invite?: string;
}

export default class Giveaways {
  public static async start(
    guild: Discord.Guild,
    channel: TextBasedGuildChannel,
    prize: string,
    time: number,
    winnersCount: number,
    requirements: Array<RequirementData> = []
  ): Promise<Giveaway> {
    const message = await channel.send(`Loading giveaway...`);

    const giveaway = await Giveaway.create({
      id: message.id,
      guildId: guild.id,
      channel: channel.id,
      prize,
      time,
      winnersCount
    });

    if (!giveaway.requirements) giveaway.requirements = [];
    for (const requirement of requirements) {
      giveaway.requirements.push(
        await GiveawayRequirement.create({
          giveawayId: giveaway.id,
          type: requirement.type,
          target: requirement.target,
          invite: requirement.invite
        })
      );
    }

    const embed = await this.giveawayToEmbed(giveaway);

    if (embed) {
      await message.edit("", { embed });
    } else {
      await message.delete();
      return giveaway; // TODO: Error
    }

    await message.react(Utils.Emojis.getRaw(Utils.Emojis.TADA));

    return giveaway;
  }

  public static async cancel(
    giveaway: string | Giveaway,
    guildId: string,
    authorId: string
  ): Promise<Giveaway> {
    if (typeof giveaway === "string")
      giveaway = (await Giveaway.findOne({
        where: { id: giveaway }
      })) as Giveaway;
    if (!giveaway) throw new Error(); // TODO: Error giveaway not found
    if (giveaway.guildId !== guildId) throw new Error(); // TODO: Error giveaway not on this guild
    const guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
    if (!guild) throw new Error(); // TODO: Error guild not found
    const channel = guild.channels.cache.get(
      giveaway.channel
    ) as TextBasedGuildChannel;
    if (channel?.type !== "text" && channel?.type !== "news") throw new Error(); // TODO: Channel invalid type
    if (!channel) throw new Error(); // TODO: Error channel not found
    const message = await channel.messages.fetch(giveaway.id);
    if (!message) throw new Error(); // TODO: Error message not found
    giveaway.cancelledBy = authorId;
    const embed = await this.giveawayToEmbed(giveaway);
    await message.edit({ embed });
    await giveaway.save();
    return giveaway;
  }

  public static async giveawayToEmbed(
    giveaway: Giveaway,
    guild?: Discord.Guild
  ) {
    if (!guild)
      guild = OpenBump.instance.client.guilds.cache.get(giveaway.guildId);
    if (!guild) throw new Error(); // TODO: Error

    const endsAt = new Date(giveaway.createdAt).valueOf() + giveaway.time;

    let description = [];

    if (giveaway.cancelledBy) {
      description.push(`This giveaway has been **cancelled**.`);
    } else {
      description.push(`React with ${Utils.Emojis.TADA} to enter!`);

      if (giveaway.winnersCount !== 1)
        description.push(`Winners: **${giveaway.winnersCount}**`);

      for (const requirement of giveaway.requirements) {
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
    }

    const ended = giveaway.endedAt || giveaway.cancelledBy;

    const embed: MessageEmbedOptions = {
      color: Utils.Colors.GREEN,
      title: `${Utils.Emojis.GIFT} ${giveaway.prize}`,
      description: description.join("\n"),
      footer: {
        text: ended
          ? `Giveaway ended`
          : `${giveaway.winnersCount} Winner${
              giveaway.winnersCount === 1 ? "" : "s"
            } | Ends at`
      },
      timestamp: ended ? undefined : endsAt
    };

    return embed;
  }
}
