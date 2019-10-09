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

module.exports.translateGuild = (guildDatabase) => {
  let tiers = []
}
