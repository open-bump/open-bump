import Discord, { ClientEvents } from "discord.js";
import ms from "ms";
import config from "../config";
import Event from "../Event";
import Utils, { EmbedError, GuildMessage } from "../Utils";

export default class MessageEvent extends Event {
  public name: keyof ClientEvents = "message";

  public async run(message: Discord.Message) {
    if (!(message.channel && message.channel instanceof Discord.GuildChannel))
      return;
    if (!(message.member && message.member instanceof Discord.GuildMember))
      return;
    if (!(message.guild && message.guild instanceof Discord.Guild)) return;
    if (
      [...config.discord.admins, config.settings.servermate.user].includes(
        message.author.id
      ) &&
      message.content === config.settings.servermate.trigger
    ) {
      // ServerMate
      await this.backgroundBump(message as GuildMessage);
    }
    await this.instance.commandManager.run(message as GuildMessage);
  }

  private async backgroundBump(message: GuildMessage) {
    const loadingReaction =
      (await message
        .react(Utils.Emojis.getRaw(Utils.Emojis.LOADINGGREEN))
        .catch(() => {})) || undefined;

    const { channel, guild, author } = message;
    const guildDatabase = await Utils.ensureGuild(message.guild);

    if (
      guildDatabase.getFeatures().includes(Utils.Feature.AUTOBUMP) &&
      guildDatabase.autobump
    ) {
      await message
        .react(Utils.Emojis.getRaw(Utils.Emojis.THUMBSDOWN))
        .catch(() => {});
      await channel
        .send("Bump request denied, you have autobump enabled.")
        .catch(() => {});
      return void (await loadingReaction?.remove());
    }

    const cooldown = guildDatabase.getCooldown(true, false);
    const nextBump = guildDatabase.lastBumpedAt
      ? guildDatabase.lastBumpedAt.valueOf() + cooldown
      : 0;
    if (nextBump && nextBump > Date.now()) {
      const remaining = nextBump - Date.now();
      await message
        .react(Utils.Emojis.getRaw(Utils.Emojis.THUMBSDOWN))
        .catch(() => {});
      await channel
        .send(
          `Bump request denied, there is a cooldown left: ${ms(remaining, {
            long: true
          })}.`
        )
        .catch(() => {});
      return void (await loadingReaction?.remove());
    }

    const missing = Utils.Bump.getMissingValues(guild, guildDatabase);
    if (missing) {
      await message
        .react(Utils.Emojis.getRaw(Utils.Emojis.THUMBSDOWN))
        .catch(() => {});
      await channel
        .send(
          `Bump request denied, use \`${Utils.getPrefix(
            guildDatabase
          )}bump\` for more information.`
        )
        .catch(() => {});
      return void (await loadingReaction?.remove());
    }

    guildDatabase.lastBumpedAt = new Date();
    guildDatabase.lastBumpedBy = author.id;
    guildDatabase.totalBumps++;
    await guildDatabase.save();

    let bumpEmbed: Discord.MessageEmbedOptions;

    try {
      bumpEmbed = await Utils.Bump.getEmbed(guild, guildDatabase);
    } catch (error) {
      let response = `Bump request denied, unknown error.`;

      if (error instanceof EmbedError) {
        guildDatabase.lastBumpedAt = null;
        await guildDatabase.save();

        response = `Bump request denied, use \`${Utils.getPrefix(
          guildDatabase
        )}bump\` for more information.`;
      }

      await message
        .react(Utils.Emojis.getRaw(Utils.Emojis.THUMBSDOWN))
        .catch(() => {});
      await channel.send(response).catch(() => {});
      return void (await loadingReaction?.remove());
    }

    await Utils.Bump.bump(guildDatabase, bumpEmbed);

    await message
      .react(Utils.Emojis.getRaw(Utils.Emojis.THUMBSUP))
      .catch(() => {});
    return void (await loadingReaction?.remove());
  }
}
