const main = require('../bot')
const config = require('../config')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const donator = require('../utils/donator')
const bump = require('../utils/bump')
const common = require('../utils/common')
const fetch = require('node-fetch')
const Guild = require('../models/Guild')
const User = require('../models/User')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let guild = msg.guild
  let channel = msg.channel
  let author = msg.author

  let userPatreon = await fetch(`http://localhost:3000/api/patreon/user/${author.id}?fetch=true&token=${config.server.token}`).then(res => res.json());
  let hasPremium = userPatreon.cents > 0;
  let dollars = `$${(userPatreon.cents / 100).toFixed(2)}`
  let servers = 0
  let used
  let userDatabase
  let left
  if(hasPremium) {
    let guildsDatabase = await Guild.find({ 'donators.id': author.id })
    used = 0;
    guildsDatabase.forEach(guildDatabase => {
      let donatorGuildDatabase = guildDatabase.donators.filter(donator => donator.id === author.id)[0]
      if(donatorGuildDatabase) {
        let tierString = donatorGuildDatabase.tier
        let tier
        Object.keys(donator.tiers).forEach(key => {
          let tierTemp = donator.tiers[key]
          if(tierTemp.id === tierString) tier = tierTemp
        })

        if(tier) {
          used = used + tier.cost
        }
        // TODO: Continue fetching tier and adding to used
      }
    });
    userDatabase = await common.getUserDatabase(author.id)
    if(userDatabase.donator.amount < userPatreon.cents) userDatabase.donator.amount = userPatreon.cents
    else if (userDatabase.donator.amount > userPatreon.cents) {
      // We got a problem
    }
    left = userPatreon.cents - used;
  }

  if(args.length === 0) {
    let options = {
      embed: {
        color: colors.green,
        title: `${emojis.star} **Premium**`,
        description: `Premium allows you to use additional features and commands. You can buy Premium from Patreon by using the link below:\n` +
            `[https://patreon.com/Looat](https://www.patreon.com/Looat)`
      }
    }
    channel.send('', options)
  } else if (args.length === 1) {
    if(args[0] === 'list') {
      let guildsDatabase = await Guild.find({ 'donators.id': author.id })
      let donatorGuildDatabase = guildDatabase.donators.filter(donator => donator.id === author.id)[0]
      let fields = []
      if(donatorGuildDatabase) {
        let tierString = donatorGuildDatabase.tier
        let tier
        Object.keys(donator.tiers).forEach(key => {
          let tierTemp = donator.tiers[key]
          if(tierTemp.id === tierString) tier = tierTemp
        })

        if(tier) {
          fields.push({
            name: `**${guildDatabase.name ? `${guildDatabase.name} | ${guildDatabase.id}` : guildDatabase.id}**`,
            value: `**${tier.name}:** $${(tier.cost / 100).toFixed(2)}`,
            inline: false
          })
        }
      }
      if(fields.length >= 1) {
        let options = {
          embed: {
            color: colors.green,
            title: `${emojis.check} **Activated Servers:**`,
            fields: fields
          }
        }
        channel.send('', options)
      } else {
        let options = {
          embed: {
            color: colors.green,
            title: `${emojis.check} **Activated Servers:**`,
            description: `No servers activated yet. Use \`${prefix}premium activate\` to activate premium for a server.`
          }
        }
        channel.send('', options)
      }
    } else if(args[0] === 'activate') {
      if(hasPremium) {
        if(userPatreon.cents > used) {
          let options = {
            embed: {
              color: colors.green,
              title: `${emojis.check} **You have Premium**`,
              description: `**Total Pledge:** ${dollars}\n` +
                  `**Already Used:** $${(used / 100).toFixed(2)}\n\n` +
                  `You still have $${(left / 100).toFixed(2)} left. To apply a premium tier to this server, use the command \`${prefix}premium activate <tier>\`.\n` +
                  `In case you want to remove a guild from your premium slots, you can use the command \`${prefix}premium deactivate [guild]\` to do so.`
            }
          }
          channel.send('', options)
        } else {
          let options = {
            embed: {
              color: colors.green,
              title: `${emojis.check} **You have Premium**`,
              description: `**Total Pledge:** ${dollars}\n` +
                  `**Already Used:** $${(used / 100).toFixed(2)}\n\n` +
                  `All entitled tiers are currently in use by other servers. To list them, please use \`${prefix}premium list\``
                  `In case you want to remove a guild from your premium slots, you can use the command \`${prefix}premium deactivate [guild]\` to do so.`
            }
          }
          channel.send('', options)
        }
      } else {
        let options = {
          embed: {
            color: colors.red,
            title: `${emojis.xmark} **No Premium Activated**`,
            description: 'It looks like you don\'t have premium.\n' +
                'This may be because you are not subscribed to our **[Patreon](https://www.patreon.com/Looat)** yet or it could be a server error.\n' +
                'If you believe this is a server error, please try again in 5 minutes and contact **[support](https://discord.gg/eBFu8HF)** if it still doesn\'t work.',
            fields: [
              {
                name: '**Important Notice**',
                value: 'You need to link your Discord account to your patreon account.\n' +
                    'To do so, please open the link below, login to your Patreon account and click on "connect". Then enter your Discord credentials to connect Discord to Patreon.\n' +
                    'After that, please use this command again.\n' +
                    '**Link: [https://patreon.com/settings/apps](https://www.patreon.com/settings/apps)**'
              }
            ]
          }
        }
        channel.send('', options)
      }
    }
  } else if (args.length >= 2) {
    if(args[0] === 'activate') {
      let argsTemp = args.slice()
      argsTemp.shift()
      let tierInput = argsTemp.join(' ').toLowerCase()
      let tierTier = null
      Object.keys(donator.tiers).forEach(key => {
        let tier = donator.tiers[key]
        if(tier.name && tier.name.toLowerCase() === tierInput) {
          tierTier = tier
        } else if (key.toLowerCase() === tierInput) {
          tierTier = tier
        }
      })
      if(tierTier) {
        if(left > tierTier.cost) {
          console.log(guildDatabase)
          console.log(userDatabase)

          let options = {
            embed: {
              color: colors.blue,
              title: `${emojis.loading} **Activating premium...**`
            }
          }
          let message = await channel.send('', options)

          if(!guildDatabase.donators) guildDatabase.donators = []
          guildDatabase.donators = guildDatabase.donators.filter(donator => donator.id !== author.id)
          guildDatabase.donators.push({
            id: author.id,
            tier: tierTier.id
          })

          if(!userDatabase.donator.assigned) userDatabase.donator.assigned = []
          userDatabase.donator.assigned = userDatabase.donator.assigned.filter(guild => guild.id !== guildDatabase.id)
          userDatabase.donator.assigned.push({
            id: guild.id,
            tier: tierTier.id
          })

          await guildDatabase.save()
          await userDatabase.save()

          console.log(guildDatabase)
          console.log(userDatabase)

          options = {
            embed: {
              color: colors.green,
              title: `${emojis.check} **Premium activated successfully**`,
              description: `You now have enabled \`${tierTier.name}\` for ${guild.name}. Check out \`${prefix}premium list\` to see which servers are currently activated.`
            }
          }
          message.edit('', options)
          // TODO: Activate tier
        } else {
          let options = {
            embed: {
              color: colors.red,
              title: `${emojis.xmark} **Tier is too expensive**`,
              description: `You can't activate this tier as it is too expensive. It costs $${(tierTier.cost / 100).toFixed(2)} but you only have $${(left / 100).toFixed(2)} left.\n` +
                  `If you already have a tier enabled for this server, try deactivating it and activating the new tier again.`
            }
          }
          channel.send('', options)
        }
      } else {
        let tierListArray = [];
        Object.keys(donator.tiers).forEach(key => {
          let tier = donator.tiers[key]
          tierListArray.push(`- \`${tier.name}\` - $${(tier.cost / 100).toFixed(2)}`)
        })
        let tierList = tierListArray.join('\n')
        let options = {
          embed: {
            color: colors.red,
            title: `${emojis.xmark} **Tier not found!**`,
            description: 'The selected tier could not be found. Here is a list of all available tiers:\n' +
                tierList
          }
        }
        channel.send('', options)
      }
    } else if(args.length === 2 && args[0] === 'deactivate') {
      // TODO: Deactivate server
    }
  }
}

module.exports.name = 'premium'
module.exports.description = 'Use this command to activate your premium.'
module.exports.syntax = 'premium [list|activate|deactivate] [tier...|guild]'
