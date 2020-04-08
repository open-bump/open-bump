const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`../config.${environment}.json`)

const bump = require('./bump')
const Guild = require('../models/Guild')
const User = require('../models/User')
const mongoose = require('mongoose')

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

module.exports.sharding.getGuild = async (guildId, index) => {
  if(index) {
    const main = require('../index')
    let guilds = (await main.manager.broadcastEval(`this.guilds.has('${guildId}') ? this.guilds.get('${guildId}') : null`))
    let guild = null
    guilds.forEach(guildI => { if(guildI) { guild = guildI } })
    return guild
  } else {
    const main = require('../bot')
    let guilds = (await main.client.shard.broadcastEval(`this.guilds.has('${guildId}') ? this.guilds.get('${guildId}') : null`))
    let guild = null
    guilds.forEach(guildI => { if(guildI) { guild = guildI } })
    return guild
  }
}

module.exports.sharding.bumpToAllShards = async (options, index, premium) => {
  const main = index ? require('../index') : require('../bot')
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

  let amount = 0;
  if (config.discord.shareShards || index || premium)
    amount =  (await (index ? main.manager : main.client.shard).broadcastEval(`this.require('./utils/common').sharding.bumpToThisShard(${JSON.stringify(args)}, ${JSON.stringify(options)})`)).reduce((prev, guildCount) => prev + guildCount, 0)
  else {
    amount = await module.exports.sharding.bumpToThisShard(args, options);
  }
  return amount;
}

module.exports.sharding.fetchUserFromIndex = async (id) => {
  const main = require('../index')
  let users = await main.manager.broadcastEval(`(function(thisp){` +
    `let user = thisp.users.has('${id}') ? thisp.users.get('${id}') : null;` +
    `if(user) {` +
    `return {` +
    `id: user.id,` +
    `username: user.username,` +
    `tag: user.tag,` +
    `discriminator: user.username,` +
    `avatar: user.avatar,` +
    `displayAvatarURL: user.displayAvatarURL,` +
    `}` +
    `}` +
    `return null;` +
  `})(this)`)
  let user = null
  users.forEach(userDiscord => { if(userDiscord) user = userDiscord })
  return user
}

module.exports.sharding.bumpToThisShard = (channels, options) => {
  return bump.bumpToThisShard(channels, options)
}

module.exports.getUserDatabase = async (userId) => {
  const userDatabase = (await User.findOrCreate({ id: userId })).doc
  return userDatabase
}

module.exports.getGuildDatabase = async (guild) => {
  if(guild.id && guild.name) {
    let guildDatabase = (await Guild.findOrCreate({ id: guild.id }, { id: guild.id, name: guild.name, name_lower: guild.name.toLowerCase() })).doc
    return guildDatabase
  } else if (guild.id) {
    let guildDatabase = (await Guild.findOrCreate({ id: guild.id }, { id: guild.id })).doc
    return guildDatabase
  } else {
    let guildDatabase = (await Guild.findOrCreate({ id: guild }, { id: guild })).doc
    return guildDatabase
  }
}

module.exports.processArray = async (t, fun/*, thisp */) => {
  if(!t || !t.length) return;
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

module.exports.toObjectId = input => {
  let ObjectId = mongoose.Types.ObjectId
  if(ObjectId.isValid(input)) {
    let objectId = new ObjectId(input)
    if(objectId.toString() === input.toString()) return objectId
  }
  return false
}

module.exports.removeValue = (array, value) => {
  let index = array.indexOf(value)
  if (index > -1) {
    array.splice(index, 1)
  }
  return array
}

module.exports.niceList = (array) => {
  if(array.length === 0) return 'nothing'
  if(array.length === 1) return array[0]
  let last = array.pop()
  return array.join(', ') + ' and ' + last
}

module.exports.getBumpChannelIssues = (channel, guildDatabase) => {
  if(!channel) return ['Internal Error']

  let guild = channel.guild

  let issues = []

  if(!channel.permissionsFor(guild.me).has('SEND_MESSAGES')) issues.push(`Please grant \`${guild.me.user.tag}\` the permission \`Send Messages\`.`)
  if(!channel.permissionsFor(guild.me).has('VIEW_CHANNEL')) issues.push(`Please grant \`${guild.me.user.tag}\` the permission \`Read Messages\`.`)
  if(!channel.permissionsFor(guild.me).has('EMBED_LINKS')) issues.push(`Please grant \`${guild.me.user.tag}\` the permission \`Embed Links\`.`)
  if(!channel.permissionsFor(guild.me).has('USE_EXTERNAL_EMOJIS')) issues.push(`Please grant \`${guild.me.user.tag}\` the permission \`Use External Emojis\`.`)

  if(guildDatabase && guildDatabase.features.includes('RESTRICTED_CHANNEL')) return issues

  Array.from(channel.permissionOverwrites.values()).forEach(permissionOverwrite => {
    if(permissionOverwrite.type !== 'role') return
    if(permissionOverwrite.id === guild.id) {
      // everyone role
      if(!permissionOverwrite.allowed.has('VIEW_CHANNEL')) issues.push(`Please grant \`@everyone\` the permission \`Read Messages\`.`)
      if(!permissionOverwrite.allowed.has('READ_MESSAGE_HISTORY')) issues.push(`Please grant \`@everyone\` the permission \`Read Message History\`.`)
    } else {
      // other role
      if(permissionOverwrite.denied.has('VIEW_CHANNEL')) issues.push(`Please grant \`@${guild.roles.get(permissionOverwrite.id) ? guild.roles.get(permissionOverwrite.id).name : permissionOverwrite.id}\` the permission \`Read Messages\`.`)
      if(permissionOverwrite.denied.has('READ_MESSAGE_HISTORY')) issues.push(`Please grant \`@${guild.roles.get(permissionOverwrite.id) ? guild.roles.get(permissionOverwrite.id).name : permissionOverwrite.id}\` the permission \`Read Message History\`.`)
    }
  })

  return issues
}

module.exports.setConsolePrefix = prefix => {
  let originalConsoleLog = console.log
  console.log = (input) => {
      args = []
      args.push('[INFO ' + prefix + ']')
      // Note: arguments is part of the prototype
      // for( let i = 0; i < arguments.length; i++ ) {
      //     args.push( arguments[i] )
      // }
      args.push(input)
      originalConsoleLog.apply( console, args )
  }

  let originalConsoleError = console.error
  console.error = (input) => {
      args = []
      args.push('[FAIL ' + prefix + ']')
      // Note: arguments is part of the prototype
      // for( let i = 0; i < arguments.length; i++ ) {
      //     args.push( arguments[i] )
      // }
      args.push(input)
      originalConsoleError.apply( console, args )
  }
}
