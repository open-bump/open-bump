import { Op } from "sequelize";
import config from "./config";
import Donator from "./models/Donator";
import User from "./models/User";
import OpenBump from "./OpenBump";

export default class Premium {
  constructor(private instance: OpenBump) {}

  public async init() {
    await this.premiumLoop();
  }

  private async premiumLoop() {
    console.log("Running premium loop...");
    // Check Nitro Booster State
    if (config.settings.nitroboost?.server) {
      const nitroBoosterGuild = this.instance.client.guilds.cache.get(
        config.settings.nitroboost.server
      );
      if (nitroBoosterGuild) {
        const confirmedNitroBoosters: Array<string> = [];

        // This is the shard with the nitro booster guild on
        for (const member of nitroBoosterGuild.members.cache.values())
          if (member.premiumSince)
            if (!confirmedNitroBoosters.includes(member.user.id))
              confirmedNitroBoosters.push(member.user.id);

        for (const donatorId of confirmedNitroBoosters) {
          let userDatabase = await User.scope("default").findOne({
            where: {
              id: donatorId
            }
          });
          if (!userDatabase)
            userDatabase = await User.scope("default").create({
              id: donatorId
            });
          if (!userDatabase.donator)
            userDatabase.donator = await userDatabase.$create<Donator>(
              "donator",
              {}
            );
          userDatabase.donator.nitroBoost = true;
          if (userDatabase.changed()) await userDatabase.save();
          if (userDatabase.donator.changed()) await userDatabase.donator.save();
        }

        await Donator.update(
          { nitroBoost: false },
          {
            where: {
              nitroBoost: true,
              userId: { [Op.notIn]: confirmedNitroBoosters }
            }
          }
        );

        console.log(
          `[Premium] Updated ${confirmedNitroBoosters.length} boosters of guild ${nitroBoosterGuild.name} (${nitroBoosterGuild.id})`
        );
      }
    }

    // Check roles
    if (config.settings.patreonRoles) {
      const donators = await Donator.findAll({
        where: { patreon: { [Op.gt]: 0 } }
      });

      const guilds = config.settings.patreonRoles.reduce(
        (reduced, current) =>
          reduced.includes(current.guild)
            ? reduced
            : [...reduced, current.guild],
        [] as Array<string>
      );

      for (const guildId of guilds) {
        const guild = this.instance.client.guilds.cache.get(guildId);
        if (guild) {
          const guildRoles = config.settings.patreonRoles
            .filter((patreonRole) => patreonRole.guild === guild.id)
            .sort((a, b) => b.cost - a.cost);
          for (const donator of donators) {
            const member = guild.members.cache.get(donator.userId);
            if (member) {
              const patreonBalance = donator.patreon;
              const role = guildRoles.find(
                (role) => role.cost <= patreonBalance
              );
              const otherRoles = guildRoles.filter(
                (otherRole) => otherRole.role !== role?.role
              );
              for (const otherRole of otherRoles) {
                const guildRole = guild.roles.cache.get(otherRole.role);
                if (guildRole)
                  if (member.roles.cache.has(guildRole.id))
                    await member.roles
                      .remove(guildRole)
                      .catch(
                        (error) =>
                          `[Error] Couldn't give role ${guildRole.name} (${guildRole.id}) on guild ${guild.name} (${guild.id}) to user ${member.user.tag} (${member.user.id}): ${error}`
                      );
              }
              if (role) {
                const guildRole = guild.roles.cache.get(role.role);
                if (guildRole)
                  if (!member.roles.cache.has(guildRole.id))
                    await member.roles
                      .add(guildRole)
                      .catch(
                        (error) =>
                          `[Error] Couldn't give role ${guildRole.name} (${guildRole.id}) on guild ${guild.name} (${guild.id}) to user ${member.user.tag} (${member.user.id}): ${error}`
                      );
              }
            }
          }
        }
      }
    }

    setTimeout(this.premiumLoop.bind(this), 1000 * 60);
  }
}
