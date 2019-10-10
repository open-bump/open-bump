module.exports.tiers = {
  /*bumpchannel: {
    cooldown: 45,
    features: ['BUMP_CHANNEL']
  },*/
  wumpus: { // $1
    features: ['COLOR', 'BANNER', 'PREFIX', 'FEATURED'],
    cost: 100,
    name: 'Wumpus',
    id: 101
  },
  boxer: { // $3
    features: ['AUTOBUMP', 'PREFIX'],
    cost: 300,
    name: 'Boxer',
    id: 102
  },
  cool_wumpus: { // $5
    features: ['COLOR', 'BANNER', 'PREFIX', 'FEATURED', 'AUTOBUMP'],
    cost: 500,
    name: 'Cool Wumpus',
    id: 103
  },
  fast_boxer: { // $5
    features: ['AUTOBUMP', 'PREFIX'],
    cooldown: 30,
    cost: 500,
    name: 'Fast Boxer',
    id: 104
  },
  super_wumpus: { // $7
    features: ['COLOR', 'BANNER', 'PREFIX', 'FEATURED', 'AUTOBUMP'],
    cooldown: 30,
    cost: 700,
    name: 'Super Wumpus',
    id: 105
  }
}

module.exports.translateFeatures = (guildDatabase) => {
  let features = guildDatabase.features.slice()
  guildDatabase.donators.forEach(donator => {
    let tier = module.exports.getTier(donator.tier)
    if(tier) {
      if(tier.features) {
        tier.features.forEach(feature => {
          if(!features.includes(feature)) features.push(feature)
        })
      }
    }
  })
  return features
}

module.exports.translateCooldown = (guildDatabase) => {
  let cooldown = 60 // <-- Default Cooldown
  guildDatabase.donators.forEach(donator => {
    let tier = module.exports.getTier(donator.tier)
    if(tier) {
      if(tier.cooldown) {
        if(tier.cooldown < cooldown) cooldown = tier.cooldown
      }
    }
  })
  return cooldown*60*1000
}

module.exports.getTier = (tierInput) => {
  let tierTier = null
  Object.keys(module.exports.tiers).forEach(key => {
    let tier = module.exports.tiers[key]
    if(tier.name && tier.name.toLowerCase() === tierInput) {
      tierTier = tier
    } else if (key.toLowerCase() === tierInput) {
      tierTier = tier
    } else if (`${tier.id}`.toLowerCase() === `${tierInput}`.toLowerCase()) {
      tierTier = tier
    }
  })
  return tierTier ? tierTier : {
    name: undefined,
    id: undefined
  }
}
