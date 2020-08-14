export const environment_ =
  process.argv.length >= 3 ? process.argv[2] : "production";
const config = require(`../config.${environment_}.json`);

export const tiers = {
  /*bumpchannel: {
    cooldown: 45,
    features: ['BUMP_CHANNEL']
  },*/
  wumpus: {
    // $1
    features: ["COLOR", "BANNER", "PREFIX", "FEATURED"],
    cost: 100,
    name: "Wumpus",
    id: 101
  },
  boxer: {
    // $3
    features: ["AUTOBUMP", "PREFIX"],
    cost: 300,
    name: "Boxer",
    id: 102
  },
  cool_wumpus: {
    // $5
    features: ["COLOR", "BANNER", "PREFIX", "FEATURED", "AUTOBUMP"],
    cost: 500,
    name: "Cool Wumpus",
    id: 103
  },
  fast_boxer: {
    // $5
    features: ["AUTOBUMP", "PREFIX"],
    cooldown: 15,
    cost: 500,
    name: "Fast Boxer",
    id: 104
  },
  super_wumpus: {
    // $7
    features: ["COLOR", "BANNER", "PREFIX", "FEATURED", "AUTOBUMP"],
    cooldown: 15,
    cost: 700,
    name: "Super Wumpus",
    id: 105
  }
};

module.exports.translateAmount = (userPatreon, userDatabase) => {
  let amount = 0;
  try {
    amount = userPatreon && userPatreon.cents ? userPatreon.cents : 0;
  } catch (err) {}
  if (userDatabase.donator.bonus) amount = amount + userDatabase.donator.bonus;
  if (userDatabase.nitroBooster) amount = amount + 500;
  return amount;
};

module.exports.translateFeatures = (guildDatabase) => {
  let features = guildDatabase.features.slice();
  guildDatabase.donators.forEach((donator) => {
    let tier = module.exports.getTier(donator.tier);
    if (tier) {
      if (tier.features) {
        tier.features.forEach((feature) => {
          if (!features.includes(feature)) features.push(feature);
        });
      }
    }
  });
  return features;
};

module.exports.isDonator = (guildDatabase) => {
  return guildDatabase.donators.length >= 1;
};

module.exports.translateCooldown = (guildDatabase) => {
  let cooldown = 60; // <-- Default Cooldown
  if (guildDatabase.feed) {
    const main = require("../bot");
    if (main.client.guilds.has(guildDatabase.id)) {
      let guild = main.client.guilds.get(guildDatabase.id);
      if (guild.channels.has(guildDatabase.feed)) {
        let channel = guild.channels.get(guildDatabase.feed);
        if (
          channel
            .permissionsFor(guild.me)
            .has([
              "SEND_MESSAGES",
              "VIEW_CHANNEL",
              "EMBED_LINKS",
              "USE_EXTERNAL_EMOJIS"
            ])
        ) {
          cooldown = 45;
        } else {
          let owner = guild.owner;
          if (owner) {
            let options = {
              embed: {
                color: colors.red,
                title: `${emojis.xmark} **Bump channel error**`,
                description:
                  "Hey there, it looks like PYS Bump doesn't have access to your bump channel anymore. " +
                  `To fix this issue, please set the bump channel again using \`${config.settings.prefix}setchannel\`.`
              }
            };
            owner.send("", options).catch(() => {});
          }
          guildDatabase.feed = undefined;
          guildDatabase.save();
        }
      } else {
        let owner = guild.owner;
        if (owner) {
          let options = {
            embed: {
              color: colors.red,
              title: `${emojis.xmark} **Bump channel error**`,
              description:
                "Hey there, it looks like your bump channel has been removed. " +
                `To fix this issue, please set the bump channel again using \`${config.settings.prefix}setchannel\`.`
            }
          };
          owner.send("", options).catch(() => {});
        }
        guildDatabase.feed = undefined;
        guildDatabase.save();
      }
    } else {
      cooldown = 45;
    }
  }
  guildDatabase.donators.forEach((donator) => {
    let tier = module.exports.getTier(donator.tier);
    if (tier) {
      if (tier.cooldown) {
        if (tier.cooldown < cooldown) cooldown = tier.cooldown;
      }
    }
  });
  return 1000 * 60 * cooldown;
};

module.exports.getTier = (tierInput) => {
  let tierTier = null;
  Object.keys(module.exports.tiers).forEach((key) => {
    let tier = module.exports.tiers[key];
    if (tier.name && tier.name.toLowerCase() === tierInput) {
      tierTier = tier;
    } else if (key.toLowerCase() === tierInput) {
      tierTier = tier;
    } else if (`${tier.id}`.toLowerCase() === `${tierInput}`.toLowerCase()) {
      tierTier = tier;
    }
  });
  return tierTier
    ? tierTier
    : {
        name: undefined,
        id: undefined
      };
};
