import { SuccessfulParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, {
  GuildMessage,
  RestrictedFeatureError,
  TitleError
} from "../Utils";

export default class SetColorCommand extends Command {
  public name = "setcolor";
  public aliases = ["color", "set-color"];
  public syntax = "setcolor <<color>|reset>";
  public description = "Set the bump color for your server";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, member } = message;

    if (!guildDatabase.getFeatures().includes(Utils.Feature.COLOR))
      throw new RestrictedFeatureError(Utils.Feature.COLOR, guildDatabase);

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (args.length >= 1) {
      if (
        !((args[0] === "reset" || args[0] === "default") && args.length === 1)
      ) {
        let newColor: number;
        try {
          newColor = Utils.textToColor(args[0]);
        } catch (error) {
          throw TitleError.create("Invalid Color", error);
        }

        guildDatabase.bumpData.color = newColor;
        await guildDatabase.bumpData.save();

        const embed = {
          color: newColor,
          title: `${Utils.Emojis.CHECK} Color has been updated`,
          description: `__**New Color:**__ ${Utils.colorToText(newColor)}`
        };
        return void (await channel.send({ embed }));
      } else {
        guildDatabase.bumpData.color = null;
        await guildDatabase.bumpData.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Color has been updated`,
          description: `__**New Color:**__ *No Color*`
        };
        return void (await channel.send({ embed }));
      }
    } else await this.sendSyntax(message, guildDatabase);
  }
}
