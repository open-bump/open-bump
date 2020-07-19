import { SuccessfulParsedMessage } from "discord-command-parser";
import Discord, { MessageEmbedOptions } from "discord.js";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class SandboxCommand extends Command {
  public name = "sandbox";
  public syntax = "sandbox [toggle|resetcd]";
  public description = "Activate sandbox to test out the bot";
  public vanished = true;

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel } = message;
    const enabled = guildDatabase.sandbox;
    if (args.length === 0) {
      const embed: MessageEmbedOptions = {
        color: enabled ? Utils.Colors.ORANGE : Utils.Colors.BLUE,
        title: `${
          enabled ? Utils.Emojis.IMPORTANTNOTICE : Utils.Emojis.INFORMATION
        } Sandbox Mode`,
        description:
          `__**Current State:**__ ${enabled ? "Enabled" : "Disabled"}\n\n` +
          `Sandbox Mode is a way for developers to test out integrations with ${this.instance.client.user?.username} without having to worry about cooldowns. ` +
          `While Sandbox Mode is on, the developer can reset the cooldown by their own. Bumped servers in Sandbox Mode do not actually get bumped to other servers.`,
        fields: [
          {
            name: "Sandbox Commands",
            value:
              `\`sandbox toggle\` - Toggle Sandbox Mode\n` +
              `\`sandbox resetcd\` - Reset cooldown`
          }
        ]
      };
      return void (await channel.send({ embed }));
    } else if (args.length === 1) {
      if (args[0] === "toggle") {
        if (!guildDatabase.sandbox) {
          // Enable Sandbox
          guildDatabase.sandbox = true;
          guildDatabase.lastBumpedAt = null;
          await guildDatabase.save();
          const embed = {
            color: Utils.Colors.ORANGE,
            title: `${Utils.Emojis.IMPORTANTNOTICE} Sandbox Mode Enabled`,
            description: `You have now access to sandbox commands, but your server's bumps won't be sent to other servers.`
          };
          return void (await channel.send({ embed }));
        } else {
          // Disable Sandbox
          guildDatabase.sandbox = false;
          guildDatabase.lastBumpedAt = new Date();
          guildDatabase.lastBumpedWith = Utils.BumpProvider.SANDBOX;
          await guildDatabase.save();
          const embed = {
            color: Utils.Colors.GREEN,
            title: `${Utils.Emojis.CHECK} Sandbox Mode Disabled`,
            description: `Your cooldown has been restarted and future bumps will be sent to other servers again.`
          };
          return void (await channel.send({ embed }));
        }
      } else if (args[0] === "resetcd") {
        if (guildDatabase.sandbox) {
          guildDatabase.lastBumpedAt = null;
          await guildDatabase.save();
          const embed = {
            color: Utils.Colors.GREEN,
            title: `${Utils.Emojis.CHECK} Cooldown Reset`,
            description: `This server can now be bumped again.`
          };
          return void (await channel.send({ embed }));
        } else return void (await this.sandboxRequired(message, guildDatabase));
      } else return void (await this.sendSyntax(message, guildDatabase));
    } else return void (await this.sendSyntax(message, guildDatabase));
  }

  private async sandboxRequired(message: Discord.Message, guild: Guild) {
    const embed = {
      color: Utils.Colors.RED,
      title: `${Utils.Emojis.XMARK} Sandbox Mode Required`,
      description: `Please activate Sandbox Mode before using this command.`
    };
    return void (await message.channel.send({ embed }));
  }
}
