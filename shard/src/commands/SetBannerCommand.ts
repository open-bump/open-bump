import { SuccessfulParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage, RestrictedFeatureError } from "../Utils";

export default class SetBannerCommand extends Command {
  public name = "setbanner";
  public aliases = ["banner", "set-banner"];
  public syntax = "setbanner <<url>|reset>";
  public description = "Set the bump banner for your server";

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, member } = message;

    if (!guildDatabase.getFeatures().includes(Utils.Feature.BANNER))
      throw new RestrictedFeatureError(Utils.Feature.BANNER, guildDatabase);

    this.requireUserPemission(["MANAGE_GUILD"], member);

    if (args.length >= 1) {
      if (
        !((args[0] === "reset" || args[0] === "default") && args.length === 1)
      ) {
        let newBanner = args[0];

        guildDatabase.bumpData.banner = newBanner;
        await guildDatabase.bumpData.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Banner has been updated`,
          description:
            `__**New Banner:**__ Image below\n` +
            `*If you can't see the image below, you might need to check your URL.*`,
          image: {
            url: newBanner
          }
        };
        return void (await channel.send({ embed }));
      } else {
        guildDatabase.bumpData.banner = null;
        await guildDatabase.bumpData.save();

        const embed = {
          color: Utils.Colors.GREEN,
          title: `${Utils.Emojis.CHECK} Banner has been updated`,
          description: `__**New Banner:**__ *No Banner*`
        };
        return void (await channel.send({ embed }));
      }
    } else await this.sendSyntax(message, guildDatabase);
  }
}
