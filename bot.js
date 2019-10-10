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
  setTimeout(() => checkPatreonLoop(), 1000*60 + client.shard.id*1000*60)
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
  try {
    // Splitting args with " " but not in quotes
    // -> https://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli#16261693
    const author = msg.author

    if(author.bot || author.id === client.user.id) return // Returned because of own message

    const guild = msg.guild

    if(!guild) return;

    /* Fetch or Create important Guild Information, e.g. Prefix and Features */
    const guildDatabase = (await Guild.findOrCreate({ id: guild.id }, { id: guild.id, name: guild.name, name_lower: guild.name.toLowerCase() })).doc

    if(guildDatabase.name !== guild.name) {
      guildDatabase.name = guild.name
      guildDatabase.name_lower = guild.name.toLowerCase()
      guildDatabase.save()
    }

    if(config.discord.closedBeta) {
      if(!donator.translateFeatures(guildDatabase).includes('EARLY_ACCESS') && !config.discord.owners.includes(author.id)) {
        if(msg.content.startsWith('ob!')) {
          let options = {
            embed: {
              color: colors.orange,
              title: 'Early Access Program',
              description: 'We are currently working on a new version of Open Bump. At the moment, only certain servers have access to all features. Other servers don\'t have access to Open Bump at all.\n' +
                  'Because the old version of Open Bump can\'t handle the high amount of requests, we are not able to keep it running until the new version is released. We are very sorry about this and hope you understand it.\n' +
                  '\n' +
                  'We are currently rolling out feature by feature, server by server. It is possible that you see other servers which already have new features.\n' +
                  'If you want to stay updated, please join [Open Advertisements](https://discord.gg/eBFu8HF). There you\'ll get the latest news about Open Bump.'
            }
          }
          msg.channel.send('', options)
        }
        return
      }
    }
    // Preparing Prefixes
    let var1 = guildDatabase.settings && guildDatabase.settings.prefix ? guildDatabase.settings.prefix.trim() + ' ' : null
    const var2 = config.settings.prefix.trim() + ' '
    const var3 = `${client.user}`.trim() + ' '
    const cont = msg.content

    /* Remove Custom Prefix if Server hasn't the required Feature */
    if(!donator.translateFeatures(guildDatabase).includes('PREFIX')) var1 = config.settings.prefix.trim() + ' '

    /* Check which Prefix was used */
    let used = null
    if(var1 != null && cont.startsWith(var1)) {
      used = var1
    } else if (var2 != null && cont.startsWith(var2)) {
      used = var2
    } else if (var3 != null && cont.startsWith(var3)) {
      used = var3
    } else if(var1 != null && cont.startsWith(var1.trim())) {
      used = var1.trim()
    } else if(var2 != null && cont.startsWith(var2.trim())) {
      used = var2.trim()
    } else if(var3 != null && cont.startsWith(var3.trim())) {
      used = var3.trim()
    }

    const prefix = (var1 ? var1 : (var2 ? var2 : var3)).trim()

    if(used) {
      let invoke = cont.substr(used.length).split(' ')[0],
          args   = cont.substr(used.length + invoke.length + 1).match(/(".*?"|[^"\r\v ]+)+(?=\s*|\s*$)/g)

      if(!args) args = []

      let argtions = []

      while(args.length >= 1 && args[args.length - 1].startsWith('-')) argtions.unshift(args.pop())

      if(commands.has(invoke)) {
        const command = commands.get(invoke)
        try {
          await command.run(msg, invoke, args, prefix, guildDatabase, argtions)
        } catch (err) {
          if(argtions.includes('-lyne')) {
            let lynelink = err.stack ? await lyne(err.stack) : null;
            const options = {
              embed: {
                color: 0xff0000,
                title: '**An error occured!**',
                description: `\`\`\`js\n${err}\`\`\`\n` +
                    `**Full Error:** ${lynelink}`
              }
            }
            msg.channel.send('', options)
          } else {
            const options = {
              embed: {
                color: 0xff0000,
                title: '**An error occured!**',
                description: `\`\`\`js\n${err}\`\`\``
              }
            }
            msg.channel.send('', options)
          }
        }
      }
    }
  } catch (err) {
    console.log('Catched Error!')
    console.log(err)
  }
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

async function checkPatreonLoop() {
  console.log(`Shard #${client.shard.id} is now doing patreon checks...`)

  try {
    let userPatreon = await fetch(`http://localhost:3000/api/patreon/user/undefined?fetch=true&token=${config.server.token}`).then(res => res.json())
    console.log('Patreon refetched')

    let usersDatabase = await User.find({ 'donator.amount': { $gt: 0 } })
    await common.processArray(usersDatabase, async userDatabase => {
      let userPatreon = await fetch(`http://localhost:3000/api/patreon/user/${userDatabase.id}?token=${config.server.token}`).then(res => res.json())
      if(userDatabase.donator.amount <= userPatreon.cents) userDatabase.donator.amount = userPatreon.cents
      let guildsDatabase = await Guild.find({ 'donators.id': userDatabase.id })
      let totalCost = 0
      guildsDatabase.forEach(guildDatabase => {
        if(!guildsDatabase.donators) guildsDatabase.donators = []
        let guildDatabaseDonator = guildDatabase.donators.filter(donator => donator.id === userDatabase.id)
        if(guildDatabaseDonator.length >= 1) {
          guildDatabaseDonator = guildDatabaseDonator[0]
          totalCost = totalCost + donator.getTier(guildDatabaseDonator.tier).cost
        }
      })
      if(totalCost > userPatreon.cents) {
        // Problem detected
        if(userDatabase.donator.transition) {
          // Already detected, check state and cancel perks if too long ago
          if(client.users.has(userDatabase.id) && !userDatabase.donator.transition.informed) {
            // Not yet informed but possible to inform, inform now
            let userDiscord = client.users.get(userDatabase.id)
            let options = {
              embed: {
                color: colors.red,
                title: `${emojis.xmark} **Problem detected**`,
                description: 'Hey there, we recently detected a problem with your Patreon pledge. It looks like your pledge does not contain enough slots for all activated servers. ' +
                    'Please fix this issue asap. You can increase your pledge or disable/change servers. If you want to see all activated servers, ' +
                    `you can use the command \`${config.settings.prefix}premium list\` to do so. Please note, the commands need to be executed on a server and not via DMs.\n` +
                    'If you think this is an error, please contact our **[support](https://discord.gg/eBFu8HF)**.'
              }
            }
            userDiscord.send('', options).catch(() => {})
            userDatabase.donator.transition.informed = true
            userDatabase.save()
          }
          if(!userDatabase.donator.transition.detected) userDatabase.donator.transition.detected = Date.now()

          if((userDatabase.donator.transition.detected.valueOf() + 1000*60*5) <= (Date.now().valueOf())) {
          // TODO: if((userDatabase.donator.transition.detected.valueOf() + 1000*60*60*24*3) <= (Date.now().valueOf())) {
            // Too long ago, no change, premium cancelling
            console.log(`User ${userDatabase.id} didn't pay for too long and now gets his premium deactivated.`)
            let userDiscord = await client.fetchUser(userDatabase.id)
            let options = {
              embed: {
                color: colors.red,
                title: `${emojis.xmark} **Premium deactivated**`,
                description: 'Hey there, this is a notice that you premium has been deactivated. This happened because we weren\'t able to check your pledge for 3 days.\n' +
                    'All your premium activations have been disabled. If you think this is an error, please contact our **[support](https://discord.gg/eBFu8HF)**.'
              }
            }
            if(userDiscord) userDiscord.send('', options).catch(() => {})
            console.log(`Patreon checks premium disabled message sent to ${userDatabase.id}`)
            guildsDatabase.forEach(guildDatabase => {
              guildDatabase.donators = guildDatabase.donators.slice()
              guildDatabase.donators = guildDatabase.donators.filter(donator => donator.id !== userDatabase.id)
              guildDatabase.save()
            })
            userDatabase.donator.transition = undefined
            userDatabase.donator.assigned = []
            userDatabase.save()
          }
        } else {
          // Not yet informed. Inform user and start transition
          let userDiscord = await client.fetchUser(userDatabase.id)
          let options = {
            embed: {
              color: colors.red,
              title: `${emojis.xmark} **Problem detected**`,
              description: 'Hey there, we recently detected a problem with your Patreon pledge. It looks like your pledge does not contain enough slots for all activated servers. ' +
                  'Please fix this issue asap. You can increase your pledge or disable/change servers. If you want to see all activated servers, ' +
                  `you can use the command \`${config.settings.prefix}premium list\` to do so. Please note, the commands need to be executed on a server and not via DMs.\n` +
                  'If you think this is an error, please contact our **[support](https://discord.gg/eBFu8HF)**.'
            }
          }
          if(userDiscord) userDiscord.send('', options).catch(() => {})
          console.log(`Patreon checks problem detected message sent to ${userDatabase.id}`)
          userDatabase.donator.transition.amount = userPatreon.cents
          userDatabase.donator.transition.detected = Date.now()
          userDatabase.donator.transition.informed = true
          userDatabase.save()
          console.log(`User ${userDatabase.id} changed his pledge. Starting transition process.`)
        }
      } else {
        let userDiscord = await client.fetchUser(userDatabase.id)
        if(userDatabase.donator.transition && userDatabase.donator.transition.informed) {
          let options = {
            embed: {
              color: colors.green,
              title: `${emojis.check} **Problem fixed**`,
              description: 'Hey there, we recently detected a problem with your Patreon pledge. However, it looks like the problem has been resolved and we removed the entry from our database.\n' +
                  'Thank you for your support!'
            }
          }
          if(userDiscord) userDiscord.send('', options).catch(() => {})
          console.log(`Patreon checks problem resolved message sent to ${userDatabase.id}`)
        }
        userDatabase.donator.transition = undefined
        userDatabase.save()
      }
    })
  } catch (error) {
    console.log('Error while checking patreon!')
    console.log(error)
  }

  setTimeout(() => checkPatreonLoop(), 1000*60*client.shard.count)
}

// Database
mongoose.connect(''.replaceAll(config.database.mongoURI, '%database%', config.database.database), { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Database successfully connected!')
      client.login(config.discord.token)
    })
    .catch(err => { console.log('Error while connecting to database!'); console.log(err) })
