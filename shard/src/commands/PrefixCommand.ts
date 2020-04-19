import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { RestrictedFeatureError } from "../Utils";

export default class PrefixCommand extends Command {
  public name = "prefix";
  public aliases = ["setprefix", "set-prefix"];
  public syntax = "prefix [<prefix>|reset]";
  public description = "View and update your prefix";
  public general = true;

  public async run(
    { message, arguments: args }: ParsedMessage,
    guildDatabase: Guild
  ) {
    const { channel } = message;

    if (args.length === 0) {
      let description = `__**Current Prefix:**__ ${Utils.getPrefix(
        guildDatabase
      )}`;
      if (!guildDatabase.getFeatures().includes(Utils.Feature.PREFIX)) {
        description +=
          `\n\n` +
          `Premium servers can change their prefix.\n` +
          `Use \`${Utils.getPrefix(
            guildDatabase
          )}premium\` to find out more about premium.`;
      }
      const embed = {
        color: Utils.Colors.GREEN,
        title: `${Utils.Emojis.CHECK} Prefix`,
        description
      };
      return void (await channel.send({ embed }));
    } else if (args.length === 1) {
      if (!guildDatabase.getFeatures().includes(Utils.Feature.PREFIX))
        throw new RestrictedFeatureError(Utils.Feature.PREFIX, guildDatabase);

      const newPrefix =
        args[0] === "reset" || args[0] === "default" ? null : args[0];

      guildDatabase.prefix = newPrefix;
      await guildDatabase.save();

      const embed = {
        color: Utils.Colors.GREEN,
        title: `${Utils.Emojis.CHECK} Prefix has been updated`,
        description: `__**New Prefix:**__ ${newPrefix || Utils.getPrefix()}`
      };
      return void (await channel.send({ embed }));
    } else return void (await this.sendSyntax(message, guildDatabase));
  }
}
