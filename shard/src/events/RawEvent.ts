import Discord from "discord.js";
import Event from "../Event";
import Giveaways from "../Giveaways";
import Giveaway from "../models/Giveaway";
import GiveawayParticipant from "../models/GiveawayParticipant";
import GiveawayRequirement from "../models/GiveawayRequirement";
import OpenBump from "../OpenBump";

interface IRawEvent {
  t: string;
}

interface IRawGuildMemberUpdateEvent extends IRawEvent {
  t: "GUILD_MEMBER_UPDATE";
  d: {
    user: Discord.PartialUser;
    roles: Array<string>;
    guild_id: string;
  };
}

export interface IGuildMemberRemoveEvent extends IRawEvent {
  t: "GUILD_MEMBER_REMOVE";
  d: {
    user: Discord.PartialUser;
    guild_id: string;
  };
}

type TRawEvent = IRawGuildMemberUpdateEvent | IGuildMemberRemoveEvent;

export default class RawEvent extends Event<any> {
  constructor(instance: OpenBump) {
    super(instance, "raw");
  }

  public async run(event: TRawEvent) {
    if (event.t === "GUILD_MEMBER_UPDATE") {
      const participants = await GiveawayParticipant.findAll({
        where: {
          userId: event.d.user.id
        },
        include: [
          {
            model: Giveaway,
            where: {
              guildId: event.d.guild_id,
              endedAt: null,
              cancelledBy: null
            },
            include: [
              {
                model: GiveawayRequirement,
                where: {
                  type: "ROLE"
                }
              }
            ]
          }
        ]
      });
      console.log(
        `[DEBUG] Updated member ${event.d.user.id} in guild ${event.d.guild_id}, found ${participants.length} giveaway participants matching.`
      );
      if (participants.length) {
        for (const participant of participants) {
          const giveaway = participant.giveaway;
          for (const requirement of giveaway.requirements) {
            if (requirement.type === "ROLE") {
              const roleId = requirement.target;
              if (roleId && !event.d.roles.includes(roleId)) {
                console.log(
                  `[DEBUG] Member ${event.d.user.id} in guild ${event.d.guild_id} lost required giveaway role ${roleId}.`
                );
                const user = await this.instance.client.users.fetch(
                  event.d.user.id
                );
                await Giveaways.kick(user, giveaway);
                continue;
              }
            }
          }
        }
      }
    } else if (event.t === "GUILD_MEMBER_REMOVE") {
      await Giveaways.onGuildMemberLeave(event);
      this.instance.networkManager.emitGuildMemberRemove(event);
    }
  }
}
