import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils from "../Utils";

export default class SetChannelCommand extends Command {
  public name = "setchannel";
  public aliases = ["set-channel"];
  public syntax = "setchannel <channel|reset>";
  public description = "Set the bump feed channel for your server";

  public async run(
    { message, arguments: args }: ParsedMessage,
    guildDatabase: Guild
  ) {
    const { channel, guild } = message;
    if (args.length === 1) {
      if (!(args[0] === "reset" || args[0] === "default")) {
        const newChannel = Utils.findChannel(args[0], guild);

        guildDatabase.feed = newChannel.id;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Channel has been updated`,
          description: `__**New Channel:**__ ${newChannel}`
        };
        return void (await channel.send({ embed }));
      } else {
        guildDatabase.feed = undefined;
        await guildDatabase.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Channel has been updated`,
          description: `__**New Channel:**__ *No Channel*`
        };
        return void (await channel.send({ embed }));
      }
    } else await this.sendSyntax(message);
  }
}
