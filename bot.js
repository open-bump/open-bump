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
const command = require('./command')

module.exports.client = client

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
const config = require('./config')
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

client.on('message', async msg => {
  command.received(msg)
  try {
    let author = msg.author;
    if(author.id === '481810078031282176') {
      // ServerMate
      let content = msg.content
      if(content.toLowerCase() === ('Asking Open Bump to bump this server').toLowerCase()) {
        let channel = msg.channel
        channel.send('This feature is not yet supported!')
      }
    }
  } catch (err) {
    console.log('Catched Error!')
    console.log(err)
  }
})

// Database
mongoose.connect(''.replaceAll(config.database.mongoURI, '%database%', config.database.database), { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Database successfully connected!')
      client.login(config.discord.token)
    })
    .catch(err => { console.log('Error while connecting to database!'); console.log(err) })
