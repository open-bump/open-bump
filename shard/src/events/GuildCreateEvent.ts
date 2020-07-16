import Discord, { MessageEmbedOptions } from "discord.js";
import ms from "ms";
import fetch, { Response } from "node-fetch";
import config from "../config";
import Event from "../Event";
import Application from "../models/Application";
import ApplicationFeature from "../models/ApplicationFeature";
import OpenBump from "../OpenBump";
import Utils from "../Utils";

interface HTTPGuild {
  id: string;
  bumpData: {
    description: string | null;
    invite: string | null;
    banner: string | null;
    color: number | null;
    updatedAt: string;
  };
}

export default class GuildCreateEvent extends Event<"guildCreate"> {
  constructor(instance: OpenBump) {
    super(instance, "guildCreate");
  }

  public async run(guild: Discord.Guild) {
    if (!this.instance.ready)
      return void console.log(
        `Ignoring guildCreate event as client isn't ready yet`
      );

    const guildDatabase = await Utils.ensureGuild(guild);
    guildDatabase.lastFailedAt = null;
    if (guildDatabase.changed()) await guildDatabase.save();

    await Utils.Notifications.postGuildAdded(guild);

    const applications = await Application.findAll({
      where: {
        shareEnabled: true
      },
      include: [
        {
          model: ApplicationFeature,
          as: "features",
          where: {
            feature: "GUILDS"
          }
        }
      ]
    });

    let sharedGuildData: Array<HTTPGuild> = [];

    for (const application of applications) {
      const url = `${application.getBase()}guilds/${guild.id}`;
      console.log(`[DEBUG] URL: ${url}`);

      const [res, guildData]: [Response, HTTPGuild] = await fetch(
        "https://proxy.discord.one/",
        {
          method: "GET",
          headers: {
            "x-target": url,
            authorization: application.authorization,
            "content-type": "application/json"
          }
        }
      ).then(async (res) => [res, await res.json()]);
      if (res.status === 200) sharedGuildData.push(guildData);
    }

    console.log("[DEBUG] Shared guild data:", sharedGuildData);

    sharedGuildData = sharedGuildData.sort(
      (a, b) =>
        new Date(b.bumpData.updatedAt).valueOf() -
        new Date(a.bumpData.updatedAt).valueOf()
    );

    const currentBumpData = guildDatabase.bumpData;
    for (const guildData of sharedGuildData) {
      currentBumpData.description =
        currentBumpData.description ||
        guildData?.bumpData.description ||
        void 0;
      if (!currentBumpData.invite && guildData?.bumpData.invite) {
        const inviteObj = await this.instance.client
          .fetchInvite(guildData.bumpData.invite)
          .catch(() => void 0);
        if (inviteObj?.channel.id) {
          const channel = guild.channels.cache.get(inviteObj.channel.id);
          if (channel) {
            const newInvite = await channel
              .createInvite({
                maxAge: 0,
                reason: `Automatically create invite for bump message`
              })
              .catch(() => void 0);
            if (newInvite) currentBumpData.invite = newInvite.code;
          }
        }
      }
      currentBumpData.banner =
        currentBumpData.banner || guildData?.bumpData.banner || void 0;
      currentBumpData.color =
        currentBumpData.color || guildData?.bumpData.color || void 0;
    }
    if (currentBumpData.changed()) await currentBumpData.save();

    const steps = [];

    if (!currentBumpData.description) {
      steps.push(
        `**Create a description about your server that other users will see:**\n` +
          `You can set it using the command \`${Utils.getPrefix(
            guildDatabase
          )}setdesc <description>\`.`
      );
    }
    if (!currentBumpData.invite) {
      steps.push(
        `**Let the bot create an invite link for your server:**\n` +
          `Use the command \`${Utils.getPrefix(
            guildDatabase
          )}setinvite\` in the channel where you want to create the invite.`
      );
    }
    if (!guildDatabase.feed) {
      steps.push(
        `**Set a bump channel to recieve other servers:**\n` +
          `Create a text channel for ${
            this.instance.client.user?.username
          } and use the command \`${Utils.getPrefix(
            guildDatabase
          )}setchannel #channel\` to set it.`
      );
    }
    steps.push(
      `**Bump your server:**\n` +
        `Use the command \`${Utils.getPrefix(
          guildDatabase
        )}bump\` to bump your server. ` +
        `You can do this every ${ms(guildDatabase.getCooldown(true), {
          long: true
        })}.`
    );

    const embed: MessageEmbedOptions = {
      color: Utils.Colors.GREEN,
      title: `Welcome to ${this.instance.client.user?.username}!`,
      description:
        `Hey there ${Utils.Emojis.WAVE}\n` +
        `\n` +
        `Thank you for inviting ${this.instance.client.user?.username} to \`${guild.name}\`.\n` +
        `Follow these steps to set up and start using ${this.instance.client.user?.username} for your server:\n` +
        `\n` +
        steps.join("\n\n") +
        `\n` +
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
