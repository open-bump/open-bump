import { ParsedMessage } from "discord-command-parser";
import Discord from "discord.js";
import Command from "../Command";
import Guild from "../models/Guild";
import OpenBump from "../OpenBump";
import Utils, { GuildMessage } from "../Utils";

export default class SetInviteCommand extends Command {
  public name = "setinvite";
  public aliases = ["set-invite"];
  public syntax = "setinvite";
  public description = "Set the invite for your server";

  constructor(instance: OpenBump) {
    super(instance, ["CREATE_INSTANT_INVITE"]);
  }

  public async run(
    { message }: ParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, author } = message;

    const invite = await channel.createInvite({
      maxAge: 0,
      reason: `${author.tag} updated the invite link.`
    });

    guildDatabase.bumpData.invite = invite.code;
    await guildDatabase.bumpData.save();

    const embed = {
      color: Utils.Colors.GREEN,
      title: `${Utils.Emojis.CHECK} Invite has been updated`,
      description: `__**New Invite:**__ https://discord.gg/${invite.code}`
    };
    return void (await channel.send({ embed }));
  }
}
