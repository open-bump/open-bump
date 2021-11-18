import { SuccessfulParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class SetBotCommand extends Command {
  public name = "setbot";
  public aliases = [
    "set-bot",
    "setbotinvite",
    "set-bot-invite",
    "set-botinvite",
    "setbotinv",
    "set-bot-inv",
    "set-botinv"
  ];
  public syntax = "setbot <<invite>|reset>";
  public description = "Set the server bot for your server";
  public cooldown = 5;

  private botIdRegex = /^[0-9]{17,20}$/;

  public async run(
    { message, arguments: args, body }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, member, guild } = message;

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (args.length >= 1) {
      if (
        !((args[0] === "reset" || args[0] === "default") && args.length === 1)
      ) {
        const newBot = args[0];

        if (this.botIdRegex.test(newBot)) {
          // It's a bot id
          try {
            const botTopGG = await Utils.Lists.getBotTopGG(newBot);
            if (botTopGG != null) {
              console.log(botTopGG);
              if (botTopGG.support) {
                const invite = await this.instance.client
                  .fetchInvite(botTopGG.support)
                  .catch(() => void 0);
                if (invite && invite.guild?.id !== guild.id) {
                  // Not the support server
                  const embed = {
                    color: Utils.Colors.RED,
                    title: `${Utils.Emojis.XMARK} Not the support server`,
                    description:
                      `It seems like this server is not ${botTopGG.username}'s support server. ` +
                      `Please ensure the support server invite on [Top.GG](https://top.gg/bot/${botTopGG.id}/edit) points to this server.\n` +
                      `\n` +
                      `If you've recently updated your bot's support server, please wait some minutes before you try using the command again.`
                  };
                  return void (await channel.send({ embed }));
                }
              }
            } else {
              // Feature disabled?
              const embed = {
                color: Utils.Colors.RED,
                title: `${Utils.Emojis.XMARK} Feature disabled`,
                description: `It seems like this feature has been disabled.`
              };
              return void (await channel.send({ embed }));
            }

            guildDatabase.bumpData.bot = newBot;
            await guildDatabase.bumpData.save();

            console.log(botTopGG);

            const embed = {
              color: Utils.Colors.GREEN,
              title: `${Utils.Emojis.CHECK} Bot has been updated`,
              description: `__**New Bot:**__ ${botTopGG.username}`
            };
            return void (await channel.send({ embed }));
          } catch (error) {
            const embed = {
              color: Utils.Colors.RED,
              title: `${Utils.Emojis.XMARK} ${
                error?.status === 403 ? "Bot Private" : "Bot Not Found"
              }`,
              description: `Please ensure your bot is added to [Top.GG](https://top.gg/bot/new) and publicly visible.`
            };
            return void (await channel.send({ embed }));
          }
        } else {
          // Invalid bot id
          const embed = {
            color: Utils.Colors.RED,
            title: `${Utils.Emojis.XMARK} Invalid Bot ID`,
            description: `Please enter a valid snowflake bot id.`
          };
          return void (await channel.send({ embed }));
        }
      } else {
        guildDatabase.bumpData.bot = null;
        await guildDatabase.bumpData.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Bot has been updated`,
          description: `__**New Bot:**__ *No Bot*`
        };
        return void (await channel.send({ embed }));
      }
    } else await this.sendSyntax(message, guildDatabase);
  }
}
