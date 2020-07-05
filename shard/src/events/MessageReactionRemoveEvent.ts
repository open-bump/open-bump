import Discord from "discord.js";
import Event from "../Event";
import Giveaways from "../Giveaways";
import OpenBump from "../OpenBump";
import Utils from "../Utils";

export default class MessageReactionRemoveEvent extends Event<
  "messageReactionRemove"
> {
  constructor(instance: OpenBump) {
    super(instance, "messageReactionRemove");
  }

  public async run(
    reaction: Discord.MessageReaction,
    user: Discord.User | Discord.PartialUser
  ) {
    if (
      Utils.Emojis.getRaw(Utils.Emojis.TADA) ===
      Utils.Emojis.getRaw(reaction.emoji)
    ) {
      // Giveaway emoji reaction
      if (
        reaction.message?.author?.id &&
        reaction.message.author.id !== this.instance.client.user?.id
      ) {
        // Message author known and not this bot
        return;
      }
      if (user.bot || user.id === this.instance.client.user?.id) {
        // Reaction author a bot or this bot
        return;
      }
      if (await Giveaways.leave(user.id, reaction.message.id)) {
        console.log(
          `Reaction on giveaway ${reaction.message.id} by ${user.id} was removed`
        );
      }
    }
  }
}
