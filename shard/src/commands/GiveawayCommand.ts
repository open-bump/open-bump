import { SuccessfulParsedMessage } from "discord-command-parser";
import Discord from "discord.js";
import ms from "ms";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, {
  GuildMessage,
  NotFoundError,
  TextBasedGuildChannel,
  TooManyResultsError,
  VoidError
} from "../Utils";

export default class GiveawayCommand extends Command {
  public name = "giveaway";
  public aliases = ["gw", "giveaways"];
  public syntax = "giveaway <start>";
  public description = "Create and manage giveaways";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, member, author } = message;

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (args.length === 1) {
      if (args[0] === "start") {
        await channel.send(
          `${Utils.Emojis.INFORMATION} This is an automatic assistant that will guide you through the setup process.\n` +
            `If at any time you wish to cancel this process, reply with \`cancel\`.\n` +
            `\n` +
            `${Utils.Emojis.HASH} Where do you want to create the giveaway? (channel)`
        );
        const targetChannel = await this.awaitMessageChannel(channel, author);

        await channel.send(
          `${Utils.Emojis.CLOCK} How long should the giveaway run? (duration)`
        );
        const targetDuration = await this.awaitMessageDuration(channel, author);

        await channel.send(
          `${Utils.Emojis.WINNERS} How many winners should there be?`
        );
        const targetWinnersCount = await this.awaitMessageWinnersCount(
          channel,
          author
        );

        // Only ask if a bot admin starts a giveaway
        await channel.send(
          `${Utils.Emojis.UPVOTE} Do participants need to upvote ${this.instance.client.user?.username}?\n` +
            `\n` +
            `**YES** - Reply with \`yes\`.\n` +
            `\n` +
            `**NO** - Reply with \`no\`.`
        );
        const targetVoteRequirement = await this.awaitMessageVoteRequirement(
          channel,
          author
        );

        await channel.send(
          `${Utils.Emojis.SLINK} Do participants need to be in a Discord server?\n` +
            `\n` +
            `**YES** - Reply with a permanent invite link to the server(s); if multiple, separate each with a space.\n` +
            `\n` +
            `**NO** - Reply with \`no\`.`
        );
        const targetGuildRequirements = await this.awaitMessageGuildRequirements(
          channel,
          author
        );

        await channel.send(
          `${Utils.Emojis.SCROLL} Do participants need to have a specific role on this server?\n` +
            `\n` +
            `**YES** - Reply with the IDs of the roles; if multiple, separate each with a space.\n` +
            `\n` +
            `**NO** - Reply with \`no\`.`
        );
        const targetRoleRequirements = await this.awaitMessageRoleRequirements(
          channel,
          author
        );

        await channel.send(
          `${Utils.Emojis.LABEL} What is the prize of the giveaway?`
        );
        const targetPrize = (await this.awaitMessage(channel, author)).content;

        await channel.send(
          `**Channel:** ${targetChannel}\n` +
            `**Duration:** ${ms(targetDuration, { long: true })}\n` +
            `**Winners:** ${targetWinnersCount}\n` +
            `**Vote Required:** ${targetVoteRequirement ? "yes" : "no"}\n` +
            `**Guild Membership Required:** ${
              targetGuildRequirements.length
                ? targetGuildRequirements
                    .map((invite) => invite.guild?.id)
                    .join(", ")
                : "no"
            }\n` +
            `**Roles Required:** ${
              targetRoleRequirements.length
                ? targetRoleRequirements.map((role) => role.id).join(", ")
                : "no"
            }\n` +
            `**Prize:** ${targetPrize}`
        );
      } else return void (await this.sendSyntax(message, guildDatabase));
    } else return void (await this.sendSyntax(message, guildDatabase));
  }

  private async awaitMessageRoleRequirements(
    channel: TextBasedGuildChannel,
    user: Discord.User
  ): Promise<Array<Discord.Role>> {
    const message = await this.awaitMessage(channel, user);
    if (message.content.toLowerCase() === "no") return [];
    const parts = message.content.split(" ");
    const roles: Array<Discord.Role> = [];
    for (const part of parts) {
      try {
        const role = Utils.findRole(part, channel.guild);
        if (role) roles.push(role);
        else throw new Error();
      } catch (error) {
        await channel.send(
          `${Utils.Emojis.XMARK} Could not find role \`${part}\`. Please verify your input and try again.`
        );
        return await this.awaitMessageRoleRequirements(channel, user);
      }
    }
    if (roles.length > 5) {
      await channel.send(
        `${Utils.Emojis.XMARK} You can require participants to be in at most 5 roles. Please try again.`
      );
      return await this.awaitMessageRoleRequirements(channel, user);
    }
    if (!roles.length) {
      await channel.send(
        `${Utils.Emojis.XMARK} Please either reply with role IDs or **no** to not require any roles.`
      );
      return await this.awaitMessageRoleRequirements(channel, user);
    }
    return roles;
  }

  private async awaitMessageGuildRequirements(
    channel: TextBasedGuildChannel,
    user: Discord.User
  ): Promise<Array<Discord.Invite>> {
    const message = await this.awaitMessage(channel, user);
    if (message.content.toLowerCase() === "no") return [];
    const matches = Utils.getAllMatches(Utils.inviteRegex, message.content).map(
      (raw) => raw[1]
    );
    const invites: Array<Discord.Invite> = [];
    for (const match of matches) {
      try {
        const invite = await this.instance.client.fetchInvite(match);
        invites.push(invite);
      } catch (error) {
        await channel.send(
          `${Utils.Emojis.XMARK} It looks like your message contains an invalid invite code. ` +
            `Please make sure your invite code is valid and, if multiple, separated by spaces. ` +
            `Then, try again.`
        );
        return await this.awaitMessageGuildRequirements(channel, user);
      }
    }
    for (const invite of invites) {
      const sameGuildInvites = invites.filter(
        (inv) => inv.guild?.id === invite.guild?.id
      );
      if (sameGuildInvites.length >= 2) {
        await channel.send(
          `${Utils.Emojis.XMARK} It looks like your message contains multiple invite links to the same server. ` +
            `Please make sure you only have one invite per server and try again.`
        );
        return await this.awaitMessageGuildRequirements(channel, user);
      }
    }
    if (invites.length > 5) {
      await channel.send(
        `${Utils.Emojis.XMARK} You can require participants to be in at most 5 servers. Please try again.`
      );
      return await this.awaitMessageGuildRequirements(channel, user);
    }
    if (!invites.length) {
      await channel.send(
        `${Utils.Emojis.XMARK} Please either reply with invite links or **no** to not require any servers.`
      );
      return await this.awaitMessageGuildRequirements(channel, user);
    }
    return invites;
  }

  private async awaitMessageVoteRequirement(
    channel: TextBasedGuildChannel,
    user: Discord.User
  ): Promise<boolean> {
    const message = await this.awaitMessage(channel, user);
    if (message.content.toLowerCase() === "yes") {
      return true;
    } else if (message.content.toLowerCase() === "no") {
      return false;
    } else {
      await channel.send(
        `${Utils.Emojis.XMARK} Please respond with **yes** or **no** and try again.`
      );
      return await this.awaitMessageVoteRequirement(channel, user);
    }
  }

  private async awaitMessageWinnersCount(
    channel: TextBasedGuildChannel,
    user: Discord.User
  ): Promise<number> {
    const message = await this.awaitMessage(channel, user);
    const number = parseInt(message.content);
    if (typeof number !== "number" || isNaN(number)) {
      await channel.send(
        `${Utils.Emojis.XMARK} Invalid number, please try again.`
      );
      return await this.awaitMessageWinnersCount(channel, user);
    }
    if (number <= 0) {
      await channel.send(
        `${Utils.Emojis.XMARK} You need to select at least 1 winner, please try again.`
      );
      return await this.awaitMessageWinnersCount(channel, user);
    }
    if (number > 10) {
      await channel.send(
        `${Utils.Emojis.XMARK} You need to select at most 10 winner, please try again.`
      );
      return await this.awaitMessageWinnersCount(channel, user);
    }
    return number;
  }

  private async awaitMessageDuration(
    channel: TextBasedGuildChannel,
    user: Discord.User
  ): Promise<number> {
    const message = await this.awaitMessage(channel, user);
    const targetDuration = ms(message.content);
    if (targetDuration) return targetDuration;
    await channel.send(
      `${Utils.Emojis.XMARK} Invalid duration, please try again. (example: \`3d\`)`
    );
    return await this.awaitMessageDuration(channel, user);
  }

  private async awaitMessageChannel(
    channel: TextBasedGuildChannel,
    user: Discord.User
  ): Promise<TextBasedGuildChannel> {
    const message = await this.awaitMessage(channel, user);
    try {
      const targetChannel = Utils.findChannel(message.content, channel.guild);
      return targetChannel;
    } catch (error) {
      if (error instanceof NotFoundError)
        await channel.send(
          `${Utils.Emojis.XMARK} Channel not found, please try again.`
        );
      else if (error instanceof TooManyResultsError)
        await channel.send(
          `${Utils.Emojis.XMARK} Too many channels found, please specify your input and try again.`
        );
      else
        await channel.send(
          `${Utils.Emojis.XMARK} Unknown error, please try again.`
        );
      return await this.awaitMessageChannel(channel, user);
    }
  }

  private async awaitMessage(
    channel: Discord.TextBasedChannelFields,
    user: Discord.User
  ) {
    try {
      const collected = await channel.awaitMessages(
        (message: GuildMessage) => message.author.id === user.id,
        {
          max: 1,
          time: 60000,
          errors: ["time"]
        }
      );
      const message = collected.find(() => true);
      if (message?.content.toLowerCase() === "cancel") {
        await channel.send(
          `${Utils.Emojis.CHECK} You have cancelled this assistant.`
        );
        throw new VoidError();
      }
      if (message) return message;
      throw new Error("Could not process input");
    } catch (error) {
      if (error instanceof Discord.Collection && !error.size) {
        await channel.send(
          `${Utils.Emojis.XMARK} ${user} took too long to respond!`
        );
        throw new VoidError();
      }
      throw error;
    }
  }
}
