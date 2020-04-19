import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils from "../Utils";

export default class SetDescriptionCommand extends Command {
  public name = "setdescription";
  public aliases = [
    "set-description",
    "setdesc",
    "set-desc",
    "description",
    "desc"
  ];
  public syntax = "setdescription <<description...>|reset>";
  public description = "Set the description for your server";
  public general = false;

  public async run(
    { message, arguments: args, body }: ParsedMessage,
    guildDatabase: Guild
  ) {
    const { channel } = message;

    if (args.length >= 1) {
      if (
        !((args[0] === "reset" || args[0] === "default") && args.length === 1)
      ) {
        const newDesc = body;

        guildDatabase.bumpData.description = newDesc;
        await guildDatabase.bumpData.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Description has been updated`,
          description: `__**New Description:**__\n${newDesc}`
        };
        return void (await channel.send({ embed }));
      } else {
        guildDatabase.bumpData.description = null;
        await guildDatabase.bumpData.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Description has been updated`,
          description: `__**New Description:**__ *No Description*`
        };
        return void (await channel.send({ embed }));
      }
    } else await this.sendSyntax(message, guildDatabase);
  }
}
