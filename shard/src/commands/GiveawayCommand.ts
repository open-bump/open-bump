import { SuccessfulParsedMessage } from "discord-command-parser";
import Discord from "discord.js";
import ms from "ms";
import Command from "../Command";
import Giveaways from "../Giveaways";
import Guild from "../models/Guild";
import User from "../models/User";
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
  public syntax = "giveaway <start|cancel <messageId>|reroll <messageId>>";
  public description = "Create and manage giveaways";
  public interactive = "The interactive setup has been cancelled!";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild,
    _userDatabase: User,
    id: string
  ) {
    const { channel, member, author, guild } = message;

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (args.length === 1) {
      if (args[0] === "start") {
        await channel.send(
          `${Utils.Emojis.INFORMATION} This is an automatic assistant that will guide you through the setup process.\n` +
            `If at any time you wish to cancel this process, reply with \`cancel\`.\n` +
            `\n` +
            `${Utils.Emojis.HASH} Where do you want to create the giveaway? (channel)`
        );
        const targetChannel = await this.awaitMessageChannel(
          channel,
          author,
          id
        );

        await channel.send(
          `${Utils.Emojis.CLOCK} How long should the giveaway run? (duration)`
        );
        const targetDuration = await this.awaitMessageDuration(
          channel,
          author,
          id
        );

        await channel.send(
          `${Utils.Emojis.WINNERS} How many winners should there be?`
        );
        const targetWinnersCount = await this.awaitMessageWinnersCount(
          channel,
          author,
          id
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
          author,
          id
        );

        // await channel.send(
        //   `${Utils.Emojis.SLINK} Do participants need to be in a Discord server?\n` +
        //     `\n` +
        //     `**YES** - Reply with a permanent invite link to the server(s); if multiple, separate each with a space.\n` +
        //     `\n` +
        //     `**NO** - Reply with \`no\`.`
        // );
        // const targetGuildRequirements = await this.awaitMessageGuildRequirements(
        //   channel,
        //   author,
        //   id
        // );
        const targetGuildRequirements: Array<any> = [];

        // await channel.send(
        //   `${Utils.Emojis.SCROLL} Do participants need to have a specific role on this server?\n` +
        //     `\n` +
        //     `**YES** - Reply with the IDs of the roles; if multiple, separate each with a space.\n` +
        //     `\n` +
        //     `**NO** - Reply with \`no\`.`
        // );
        // const targetRoleRequirements = await this.awaitMessageRoleRequirements(
        //   channel,
        //   author,
        //   id
        // );
        const targetRoleRequirements: Array<any> = [];

        await channel.send(
          `${Utils.Emojis.LABEL} What is the prize of the giveaway?`
        );
        const targetPrize = (await this.awaitMessage(channel, author, id))
          .content;

        const description =
          `**Channel:** ${targetChannel}\n` +
          `**Duration:** ${ms(targetDuration, { long: true })}\n` +
          `**Winners:** ${targetWinnersCount}\n` +
          `**Vote Required:** ${targetVoteRequirement ? "yes" : "no"}\n` +
          `**Guild Membership Required:** ${
            targetGuildRequirements.length
              ? targetGuildRequirements
                  .map(
                    (invite) =>
                      `**[${invite.guild?.name}](https://discord.gg/${invite.code})**`
                  )
                  .join(", ")
              : "no"
          }\n` +
          `**Roles Required:** ${
            targetRoleRequirements.length
              ? targetRoleRequirements
                  .map((role) => `<@&${role.id}>`)
                  .join(", ")
              : "no"
          }\n` +
          `**Prize:** ${targetPrize}`;

        const embed = {
          color: Utils.Colors.BLUE,
          title: `${Utils.Emojis.INFORMATION} Confirmation`,
          description:
            description +
            `\n` +
            `\n` +
            `**Please react with ${Utils.Emojis.CHECK} to confirm and start the giveaway.**`
        };
        const confirmationMessage = await channel.send({ embed });
        const confirmationReaction = await confirmationMessage.react(
          Utils.Emojis.getRaw(Utils.Emojis.CHECK)
        );

        try {
          await confirmationMessage.awaitReactions(
            (reaction: Discord.MessageReaction, user: Discord.User) =>
              user.id === author.id &&
              (reaction.emoji.id === Utils.Emojis.getRaw(Utils.Emojis.CHECK) ||
                reaction.emoji.name === Utils.Emojis.CHECK),
            { time: 30000, max: 1, errors: ["time"] }
          );
        } catch (error) {
          embed.description =
            description +
            `\n` +
            `\n` +
            `**This assistant has timed out. Please restart the process.**`;
          await confirmationMessage.edit({ embed });
          if (confirmationReaction)
            await confirmationReaction.users
              .remove(this.instance.client.user?.id)
              .catch(() => {});
          return;
        }

        if (confirmationReaction)
          await confirmationReaction.users
            .remove(this.instance.client.user?.id)
            .catch(() => {});

        const giveaway = await Giveaways.start(
          guild,
          targetChannel,
          targetPrize,
          targetDuration,
          targetWinnersCount,
          [
            ...(targetVoteRequirement ? [{ type: "VOTE" as "VOTE" }] : []),
            ...targetGuildRequirements.map((invite) => ({
              type: "GUILD" as "GUILD",
              target: invite.guild?.id,
              invite: invite.code
            })),
            ...targetRoleRequirements.map((role) => ({
              type: "ROLE" as "ROLE",
              target: role.id
            }))
          ],
          author.id
        );

        await channel.send(
          `${Utils.Emojis.CHECK} The giveaway in ${targetChannel} with ID \`${giveaway.id}\` has been started.`
        );
      } else return void (await this.sendSyntax(message, guildDatabase));
    } else if (args.length === 2) {
      if (args[0] === "cancel") {
        const giveaway = await Giveaways.cancel(args[1], guild.id, author.id);
        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Giveaway Cancelled`,
          description: `The giveaway in the channel <#${giveaway.channel}> has been cancelled.`
        };
        await channel.send({ embed });
      } else if (args[0] === "reroll") {
        const giveaway = await Giveaways.reroll(args[1], channel);
        // const embed = {
        //   color: Utils.Colors.GREEN,
        //   title: `${Utils.Emojis.CHECK} Giveaway Cancelled`,
        //   description: `The giveaway in the channel <#${giveaway.channel}> has been cancelled.`
        // };
        // await channel.send({ embed });
      } else return void (await this.sendSyntax(message, guildDatabase));
    } else return void (await this.sendSyntax(message, guildDatabase));
  }

  private async awaitMessageRoleRequirements(
    channel: TextBasedGuildChannel,
    user: Discord.User,
    id: string
  ): Promise<Array<Discord.Role>> {
    const message = await this.awaitMessage(channel, user, id);
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
        return await this.awaitMessageRoleRequirements(channel, user, id);
      }
    }
    if (roles.length > 5) {
      await channel.send(
        `${Utils.Emojis.XMARK} You can require participants to be in at most 5 roles. Please try again.`
      );
      return await this.awaitMessageRoleRequirements(channel, user, id);
    }
    if (!roles.length) {
      await channel.send(
        `${Utils.Emojis.XMARK} Please either reply with role IDs or **no** to not require any roles.`
      );
      return await this.awaitMessageRoleRequirements(channel, user, id);
    }
    return roles;
  }

  private async awaitMessageGuildRequirements(
    channel: TextBasedGuildChannel,
    user: Discord.User,
    id: string
  ): Promise<Array<Discord.Invite>> {
    const message = await this.awaitMessage(channel, user, id);
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
        return await this.awaitMessageGuildRequirements(channel, user, id);
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
        return await this.awaitMessageGuildRequirements(channel, user, id);
      }
    }
    if (invites.length > 5) {
      await channel.send(
        `${Utils.Emojis.XMARK} You can require participants to be in at most 5 servers. Please try again.`
      );
      return await this.awaitMessageGuildRequirements(channel, user, id);
    }
    if (!invites.length) {
      await channel.send(
        `${Utils.Emojis.XMARK} Please either reply with invite links or **no** to not require any servers.`
      );
      return await this.awaitMessageGuildRequirements(channel, user, id);
    }
    return invites;
  }

  private async awaitMessageVoteRequirement(
    channel: TextBasedGuildChannel,
    user: Discord.User,
    id: string
  ): Promise<boolean> {
    const message = await this.awaitMessage(channel, user, id);
    if (message.content.toLowerCase() === "yes") {
      return true;
    } else if (message.content.toLowerCase() === "no") {
      return false;
    } else {
      await channel.send(
        `${Utils.Emojis.XMARK} Please respond with **yes** or **no** and try again.`
      );
      return await this.awaitMessageVoteRequirement(channel, user, id);
    }
  }

  private async awaitMessageWinnersCount(
    channel: TextBasedGuildChannel,
    user: Discord.User,
    id: string
  ): Promise<number> {
    const message = await this.awaitMessage(channel, user, id);
    const number = parseInt(message.content);
    if (typeof number !== "number" || isNaN(number)) {
      await channel.send(
        `${Utils.Emojis.XMARK} Invalid number, please try again.`
      );
      return await this.awaitMessageWinnersCount(channel, user, id);
    }
    if (number <= 0) {
      await channel.send(
        `${Utils.Emojis.XMARK} You need to select at least 1 winner, please try again.`
      );
      return await this.awaitMessageWinnersCount(channel, user, id);
    }
    if (number > 10) {
      await channel.send(
        `${Utils.Emojis.XMARK} You need to select at most 10 winner, please try again.`
      );
      return await this.awaitMessageWinnersCount(channel, user, id);
    }
    return number;
  }

  private async awaitMessageDuration(
    channel: TextBasedGuildChannel,
    user: Discord.User,
    id: string
  ): Promise<number> {
    const message = await this.awaitMessage(channel, user, id);
    const targetDuration = ms(message.content);
    if (!targetDuration) {
      await channel.send(
        `${Utils.Emojis.XMARK} Invalid duration, please try again. (example: \`3d\`)`
      );
      return await this.awaitMessageDuration(channel, user, id);
    }
    if (targetDuration <= 1000 * 60) {
      await channel.send(
        `${Utils.Emojis.XMARK} The duration needs to be at least 1 minute, please try again.`
      );
      return await this.awaitMessageDuration(channel, user, id);
    }
    if (targetDuration > 1000 * 60 * 60 * 24 * 30) {
      await channel.send(
        `${Utils.Emojis.XMARK} The duration can be at most 30 days, please try again.`
      );
      return await this.awaitMessageDuration(channel, user, id);
    }
    return targetDuration;
  }

  private async awaitMessageChannel(
    channel: TextBasedGuildChannel,
    user: Discord.User,
    id: string
  ): Promise<TextBasedGuildChannel> {
    const message = await this.awaitMessage(channel, user, id);
    try {
      const requiredPermissions = new Discord.Permissions([
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "MANAGE_MESSAGES",
        "EMBED_LINKS",
        "ADD_REACTIONS",
        "USE_EXTERNAL_EMOJIS"
      ]);
      const targetChannel = Utils.findChannel(message.content, channel.guild);
      const channelPermissions = targetChannel.permissionsFor(
        String(this.instance.client.user?.id)
      );
      const missing =
        requiredPermissions.bitfield & ~(channelPermissions?.bitfield || 0);
      if (missing) {
        await channel.send(
          `${Utils.Emojis.XMARK} **Permissions Error**\n` +
            `Make sure the bot has the following permissions in the channel ${targetChannel} and try again:\n` +
            Utils.getPermissionIdentifiers(missing)
              .map(Utils.translatePermission)
              .map((permission) => `- \`${permission}\``)
              .join("\n") +
            `\n` +
            `\n` +
            `Note: The assistant has been cancelled, please reuse the command again.`
        );
        throw new VoidError();
      }
      return targetChannel;
    } catch (error) {
      if (error instanceof VoidError) {
        throw error;
      } else if (error instanceof NotFoundError)
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
      return await this.awaitMessageChannel(channel, user, id);
    }
  }

  private async awaitMessage(
    channel: Discord.TextBasedChannelFields,
    user: Discord.User,
    id: string
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
      if (!this.instance.commandManager.isRunning(id)) throw new VoidError();
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
