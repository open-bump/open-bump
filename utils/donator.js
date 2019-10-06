module.exports.tiers = {
  /*bumpchannel: {
    cooldown: 45,
    features: ['BUMP_CHANNEL']
  },*/
  wumpus: { // $1
    features: ['COLOR', 'BANNER', 'PREFIX', 'FEATURED']
  },
  boxer: { // $3
    features: ['AUTOBUMP', 'PREFIX']
  },
  cool_wumpus: { // $5
    features: ['COLOR', 'BANNER', 'PREFIX', 'FEATURED', 'AUTOBUMP'],
  },
  fast_boxer: { // $5
    features: ['AUTOBUMP', 'PREFIX'],
    cooldown: 30
  },
  super_wumpus: { // $7
    features: ['COLOR', 'BANNER', 'PREFIX', 'FEATURED', 'AUTOBUMP'],
    cooldown: 30
  }
}

module.exports.translateGuild = (guildDatabase) => {
  let tiers = [];
}
