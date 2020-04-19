import { ParsedMessage } from "discord-command-parser";
import Command from "../Command";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class SetInviteCommand extends Command {
  public name = "setinvite";
  public aliases = ["set-invite", "setdesc", "set-desc"];
  public syntax = "setinvite";
  public description = "Set the invite for your server";
  public general = false;

  public async run(
    { message, arguments: args, body }: ParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, guild, author } = message;
    if (
      channel
        .permissionsFor(String(this.instance.client.user?.id))
        ?.has("CREATE_INSTANT_INVITE")
    ) {
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
    } else {
      const embed = {
        color: Utils.Colors.RED,
        title: `${Utils.Emojis.XMARK} Missing Permissions`,
        description: `Make sure ${this.instance.client.user?.username} has the \`Create Instant Invite\` permission in this channel to be able to set an invite.`
      };
    }
  }
}
