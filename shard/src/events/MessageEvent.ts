import Discord, { ClientEvents } from "discord.js";
import Event from "../Event";
import { GuildMessage } from "../Utils";

export default class MessageEvent extends Event {
  public name: keyof ClientEvents = "message";

  public async run(message: Discord.Message) {
    if (!(message.channel && message.channel instanceof Discord.GuildChannel))
      return;
    if (!(message.member && message.member instanceof Discord.GuildMember))
      return;
    if (!(message.guild && message.guild instanceof Discord.Guild)) return;
    await this.instance.commandManager.run(message as GuildMessage);
  }
}
