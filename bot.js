// Imports
const Discord = require('discord.js')
const Guild = require('./models/Guild')
const User = require('./models/User')
const client = new Discord.Client()
const mongoose = require('mongoose')
const fetch = require('node-fetch')
const colors = require('./utils/colors')
const emojis = require('./utils/emojis')
const bump = require('./utils/bump')
const common = require('./utils/common')
const donator = require('./utils/donator')
const lyne = require('./utils/lyne')
const patreon = require('./patreon')
const moment = require('moment')
const ms = require('ms')
const command = require('./command')

module.exports.client = client

common.setConsolePrefix(`Shard #${client.shard.id}`)

// Prototype Changes (not recommended, but the most effective)
String.prototype.replaceAll = (str, search, replacement) => {
  return str && str.replace ? str.replace(new RegExp(search, 'g'), replacement) : str
}

Object.defineProperty(global, '__stack', {
get: function() {
        var orig = Error.prepareStackTrace
        Error.prepareStackTrace = function(_, stack) {
            return stack
        }
        var err = new Error
        Error.captureStackTrace(err, arguments.callee)
        var stack = err.stack
        Error.prepareStackTrace = orig
        return stack
    }
})

Object.defineProperty(global, '__line', {
get: function() {
        return __stack[1].getLineNumber()
    }
})

Object.defineProperty(global, '__function', {
get: function() {
        return __stack[1].getFunctionName()
    }
})

client.require = (path) => {
  return require(path)
}

// Config
const config = require('./config') // TODO: Set correct Nitro booster role
module.exports.config = config

// Discord
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  setTimeout(() => bump.autoBumpLoop(), 1000*30 + client.shard.id*1000*60)
  setTimeout(() => patreon.checkPatreonLoop(), 1000*60 + client.shard.id*1000*60)
})

// Commands
const commands = new Discord.Collection()
module.exports.commands = commands
registerCommand('./commands/about')
registerCommand('./commands/application')
registerCommand('./commands/autobump')
registerCommand('./commands/bump')
registerCommand('./commands/eval')
registerCommand('./commands/help')
registerCommand('./commands/prefix')
registerCommand('./commands/premium')
registerCommand('./commands/preview')
registerCommand('./commands/setbanner')
registerCommand('./commands/setchannel')
registerCommand('./commands/setcolor')
registerCommand('./commands/setdescription')
registerCommand('./commands/setinvite')
registerCommand('./commands/setprefix')
registerCommand('./commands/stats')

function registerCommand(path, name, alias) {
  let command = require(path)
  if(!name) name = command.name
  if(!name) throw new Error('Trying to register a command that is not a command!')
  commands.set(name, command)
  if(!alias && command.aliases) {
    command.aliases.forEach(alias => {
      registerCommand(path, alias, true)
    })
  }
}

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if(newMember.guild.id === config.discord.server) {
    let booster = false
    newMember.roles.forEach(role => {
      if(role.id === config.discord.boosterRole) booster = true
    })
    let userDatabase = await common.getUserDatabase(newMember.user.id)
    if(booster) {
      if(!userDatabase.nitroBooster) {
        userDatabase.nitroBooster = true
        userDatabase.save()
        let options = {
          embed: {
            color: colors.green,
            title: `${emojis.check} **Boost power enabled**`,
            description: 'Hey there, we just saw you boosted our server Open Advertisements. That\'s awesome, thank you so much! ' +
                `As a thank you, you get a free bonus of $5.00 that allows you to use the premium version of this bot.\n` +
                `To start using it, please check out the command \`${config.settings.prefix}premium\`. It will tell you how you can use your bonus.`
          }
        }
        newMember.user.send('', options).catch(() => {})
      }
    } else {
      if(userDatabase.nitroBooster) {
        userDatabase.nitroBooster = false
        userDatabase.save()
        let options = {
          embed: {
            color: colors.red,
            title: `${emojis.xmark} **Boost power disabled**`,
            description: 'Hey there, we just saw you removed your boost from Open Advertisements. ' +
                `Because of that, you lost your free $5.00 bonus. That's sad!\n` +
                `You may receive further messages from this bot in case your new balance isn't enough to cover the costs for all activated servers.`
          }
        }
        newMember.user.send('', options).catch(() => {})
      }
    }
  }
})

client.on('message', async msg => {
  command.received(msg)
  try {
    let author = msg.author;
    if(author.id === '481810078031282176' || config.discord.owners.includes(author.id)) {
      // ServerMate
      let content = msg.content
      if(content.toLowerCase() === ('Asking Open Bump to bump this server').toLowerCase()) {
        let channel = msg.channel
        let guild = msg.guild
        if(channel.permissionsFor(guild.me).has(['ADD_REACTIONS'])) {
          let reaction = await msg.react(common.getEmojiId(emojis.loadingGreen))
          let guildDatabase = await common.getGuildDatabase(guild)
          let cooldown = donator.translateCooldown(guildDatabase)
          if(donator.translateFeatures(guildDatabase).includes('AUTOBUMP') && guildDatabase.autoBump) {
            await msg.react(common.getEmojiId(emojis.thumbsdown))
            await channel.send(`Bump request denied, you have autobump enabled.`).catch(() => {})
            await reaction.remove()
            return;
          }
          if(guildDatabase.lastBump && guildDatabase.lastBump.time) {
            let cooldown = donator.translateCooldown(guildDatabase)
            let nextBump = moment(guildDatabase.lastBump.time.valueOf() + cooldown)
            if(nextBump.isAfter(moment())) {
              let remaining = ms(nextBump.valueOf() - moment().valueOf(), { long: true })
              await msg.react(common.getEmojiId(emojis.thumbsdown))
              await channel.send(`Bump request denied, there is a cooldown left: ${remaining}.`).catch(() => {})
              await reaction.remove()
              return;
            }
          }
          if(await bump.isReady(guild, guildDatabase) !== true) {
            await msg.react(common.getEmojiId(emojis.thumbsdown))
            await channel.send(`Bump request denied, your guild has not finished setup. Use \`ob!bump\` for more information.`).catch(() => {})
            await reaction.remove()
            return;
          }
          guildDatabase.lastBump = {}
          guildDatabase.lastBump.user = author.id
          guildDatabase.lastBump.time = Date.now()
          await guildDatabase.save()
          let options = await bump.getPreviewEmbed(guild, guildDatabase)
          await bump.bumpToAllShards(options)
          await msg.react(common.getEmojiId(emojis.thumbsup))
          await reaction.remove()
        }
      }
    }
  } catch (err) {
    console.log('Catched Error!')
    console.log(err)
  }
})

// Database
mongoose.connect(''.replaceAll(config.database.mongoURI, '%database%', config.database.database), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(() => {
  console.log('Database successfully connected!')
  client.login(config.discord.token)
}).catch(err => { console.log('Error while connecting to database!'); console.log(err) })
