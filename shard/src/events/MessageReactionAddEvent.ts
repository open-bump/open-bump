import Discord from "discord.js";
import Event from "../Event";
import Giveaways from "../Giveaways";
import Giveaway from "../models/Giveaway";
import OpenBump from "../OpenBump";
import Utils from "../Utils";

export default class MessageReactionAddEvent extends Event<
  "messageReactionAdd"
> {
  constructor(instance: OpenBump) {
    super(instance, "messageReactionAdd");
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
      const giveaway = await Giveaway.findOne({
        where: { id: reaction.message.id }
      });
      if (giveaway) {
        console.log(`Reaction on giveaway ${giveaway.id} by ${user.id}`);
        Giveaways.enter(user, giveaway, reaction);
      }
    }
  }
}
