import Discord from "discord.js";
import config from "./config";
import OpenBump from "./OpenBump";
import Utils from "./Utils";

export default class Integration {
  constructor(private instance: OpenBump) {}

  public async getBotSuggestion(guild: Discord.Guild) {
    let suggestions = config.settings.integration?.suggestions || [];
    suggestions = Utils.shuffleArray(suggestions);
    for (const suggestion of suggestions) {
      const member = await guild.members.fetch(suggestion.bot).catch(() => {});
      if (!member) return suggestion;
    }
    return null;
  }
}
