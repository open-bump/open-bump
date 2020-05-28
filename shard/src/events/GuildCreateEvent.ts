import Discord, { ClientEvents, MessageEmbedOptions } from "discord.js";
import config from "../config";
import Event from "../Event";
import Utils from "../Utils";

export default class GuildCreateEvent extends Event {
  public name: keyof ClientEvents = "guildCreate";

  public async run(guild: Discord.Guild) {
    if (!this.instance.ready)
      return void console.log(
        `Ignoring guildCreate event as client isn't ready yet`
      );

    const guildDatabase = await Utils.ensureGuild(guild);
    guildDatabase.lastFailedAt = null;
    if (guildDatabase.changed()) await guildDatabase.save();

    await Utils.Notifications.postGuildAdded(guild);

    const embed: MessageEmbedOptions = {
      color: Utils.Colors.GREEN,
      title: `Welcome to ${this.instance.client.user?.username}!`,
      description:
        `Hey there ${Utils.Emojis.WAVE}\n` +
        `\n` +
        `Thank you for inviting ${this.instance.client.user?.username} to \`${guild.name}\`.\n` +
        `Follow these steps to set up ${this.instance.client.user?.username} for your server:\n` +
        `\n` +
        `**Create a description about your server that other users will see:**\n` +
        `You can set it using the command \`${Utils.getPrefix(
          guildDatabase
        )}setdesc <description>\`.\n` +
        `\n` +
        `**Let the bot create an invite link for your server:**\n` +
        `Use the command \`${Utils.getPrefix(
          guildDatabase
        )}setinvite\` in the channel where you want to create the invite.\n` +
        `\n` +
        `**Set a bump channel to recieve other servers:**\n` +
        `Create a text channel for ${
          this.instance.client.user?.username
        } and use the command \`${Utils.getPrefix(
          guildDatabase
        )}setchannel #channel\` to set it.\n` +
        `\n` +
        `That's it. Use the command \`${Utils.getPrefix(
          guildDatabase
        )}help\` for a full list of bot commands.\n` +
        `\n` +
        `**[Join Support](${config.settings.support})** | **[View Patreon](${
          config.settings.patreon
        })** | **[Invite ${
          this.instance.client.user?.username
        }](${Utils.getInviteLink()})**`,
      thumbnail: {
        url: this.instance.client.user?.displayAvatarURL()
      }
    };

    let channel: Discord.GuildChannel | null = guild.systemChannel;
    if (!channel)
      channel =
        guild.channels.cache
          .sort((a, b) => a.position - b.position)
          .find((channel) =>
            Boolean(
              channel.type === "text" &&
                channel
                  .permissionsFor(String(this.instance.client.user?.id))
                  ?.has(Discord.Permissions.FLAGS.SEND_MESSAGES)
            )
          ) || null;
    if (channel && channel instanceof Discord.TextChannel)
      await channel.send({ embed }).catch(() => {});
  }
}
