const bump = require('./bump')
const Guild = require('../models/Guild')
const User = require('../models/User')

module.exports.id = {
  min: 41943044,
  max: 184467440737095516166
}

module.exports.includesAll = (array, contains) => {
  if(!contains) return true
  if(!contains.every) return array.includes(contains)
  let success = array.every((val) => {
      return contains.indexOf(val) !== -1
  })
  return success
}

module.exports.sharding = {}

module.exports.sharding.getGuildShardId = (guildId) => {
  const main = require('../bot')
  return ~~((typeof guildId === 'number' ? guildId : parseInt(guildId)) / 4194304 % main.client.shard.count)
}

module.exports.sharding.getGuild = async (guildId) => {
  const main = require('../bot')
  let shardId = module.exports.sharding.getGuildShardId(guildId)
  let guilds = (await main.client.shard.broadcastEval(`this.shard.id === ${shardId} ? this.guilds.get('${guildId}') : null`))
  if(guilds.length >= 1) return guilds[0]
  return null
}

module.exports.sharding.bumpToAllShards = async (options) => {
  const main = require('../bot')
  const guildsDatabase = await Guild.find({
    $and: [
      { feed: { $exists: true } },
      { feed: { $ne: null } },
      { feed: { $ne: '' } }
    ]
  })
  let args = []
  guildsDatabase.forEach(guildDatabase => {
    args.push({guild: guildDatabase.id, channel: guildDatabase.feed})
  })

  return (await main.client.shard.broadcastEval(`this.require('./utils/common').sharding.bumpToThisShard(${JSON.stringify(args)}, ${JSON.stringify(options)})`)).reduce((prev, guildCount) => prev + guildCount, 0)
}

module.exports.sharding.bumpToThisShard = (channels, options) => {
  return bump.bumpToThisShard(channels, options)
}

module.exports.getUserDatabase = async (user) => {
  const userDatabase = (await User.findOrCreate({ id: user })).doc
  return userDatabase
}

module.exports.processArray = async (t, fun/*, thisp */) => {
  let length = t.length >>> 0
  let thisp = arguments[2]
  for (let i = 0; i < length; i++) {
    if (i in t) await fun.call(thisp, t[i], i, t)
  }
}

module.exports.capitalizeFirstLetter = string => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

module.exports.getEmojiId = emoji => {
  let regex = /<a?:.{0,}:([0-9]{10,20})>/gm
  let m

  while ((m = regex.exec(emoji)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    let res = null
    m.forEach((match, groupIndex) => {
      if(groupIndex === 1) res = match
    })
    return res
  }
}
