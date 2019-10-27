const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment;
const config = require(`../config.${environment}.json`)

const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const donator = require('../utils/donator')
const bump = require('../utils/bump')
const common = require('../utils/common')
const fetch = require('node-fetch')
const ms = require('ms')
const Guild = require('../models/Guild')
const User = require('../models/User')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let guild = msg.guild
  let channel = msg.channel
  let author = msg.author

  let userDatabase = await common.getUserDatabase(author.id)
  let userPatreon = await fetch(`http://localhost:3000/api/patreon/user/${author.id}?fetch=true`, {
    headers: {
      authorization: `Bearer ${config.server.token}`
    }
  }).then(res => res.json())
  let dollars = `$${(donator.translateAmount(userPatreon, userDatabase) / 100).toFixed(2)}`
  let servers = 0
  let used
  let hasPremium = donator.translateAmount(userPatreon, userDatabase) > 0;
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
      }
    });
    if(userDatabase.donator.amount < donator.translateAmount(userPatreon, userDatabase)) userDatabase.donator.amount = donator.translateAmount(userPatreon, userDatabase)
    left = donator.translateAmount(userPatreon, userDatabase) - used;
  }

  if(args.length === 0) {
    let fields = []
    if(hasPremium) fields.push({
      name: `${emojis.bell} **You are a donator!**`,
      value: `It looks like you already are a donator. View your activations using the command \`${prefix}premium view\``,
      inline: false
    })
    let options = {
      embed: {
        color: colors.orange,
        title: `${emojis.star} **Premium**`,
        description: `Premium allows you to use additional features and commands. You can buy Premium from Patreon by using the link below:\n` +
            `[https://patreon.com/Looat](https://www.patreon.com/Looat)\n\n` +
            `To see a list of all available tiers, please use the command \`${prefix}premium list\`.`,
        fields: fields
      }
    }
    channel.send('', options)
  } else if (args.length === 1 && args[0] === 'list') {
    let fields = [];
    Object.keys(donator.tiers).forEach(key => {
      let tier = donator.tiers[key]
      let features = []
      tier.features.forEach(feature => features.push('- ' + common.capitalizeFirstLetter(feature)))
      if(tier.cooldown) features.push(`- ${ms(tier.cooldown*1000*60, { long: true })} cooldown`)
      fields.push({
        name: `${tier.name} | $${(tier.cost / 100).toFixed(2)}`,
        value: features.join('\n'),
        inline: false
      })
    })
    let options = {
      embed: {
        color: colors.orange,
        title: `${emojis.star} **Premium Tiers**`,
        description: 'Below is a list of all available premium tiers. To buy a tier, please pledge on [https://patreon.com/Looat](https://www.patreon.com/Looat).',
        fields: fields
      }
    }
    channel.send('', options)
  } else if (!hasPremium) {
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
  } else if (args.length === 1) {
    if(args[0] === 'view') {
      let guildsDatabase = await Guild.find({ 'donators.id': author.id })
      let fields = []
      await common.processArray(guildsDatabase, guildDatabase => {
        let donatorGuildDatabase = guildDatabase.donators.filter(donator => donator.id === author.id)[0]
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
      })
      if(fields.length >= 1) {
        if(used <= donator.translateAmount(userPatreon, userDatabase)) {
          let options = {
            embed: {
              color: colors.blue,
              title: `${emojis.information} **Activated Servers:**`,
              description: `**Total Balance:** ${dollars}\n` +
                  `**Already Used:** $${(used / 100).toFixed(2)}`,
              fields: fields
            }
          }
          channel.send('', options)
        } else {
          fields.push({
            name: `${emojis.importantNotice} **Payment problem**`,
            value: 'Your Current Balance doesn\'t have enough space for all your activations.\n' +
                'Please fix this issue asap by updating your pledge or your activating servers.\n' +
                'If you ignore this message, your subscriptions may will stop working soon.\n' +
                `**Current Balance:** $${(donator.translateAmount(userPatreon, userDatabase) / 100).toFixed(2)}\n` +
                `**Required Balance:** $${(used / 100).toFixed(2)}`
          })
          let options = {
            embed: {
              color: colors.orange,
              title: `${emojis.information} **Activated Servers:**`,
              description: `**Total Balance:** ${dollars}\n` +
                  `**Already Used:** $${(used / 100).toFixed(2)}`,
              fields: fields
            }
          }
          channel.send('', options)
        }
      } else {
        let options = {
          embed: {
            color: colors.blue,
            title: `${emojis.information} **Activated Servers:**`,
            description: `**Total Balance:** ${dollars}\n` +
                `**Already Used:** $${(used / 100).toFixed(2)}\n\n` +
                `No servers activated yet. Use \`${prefix}premium activate\` to activate premium for a server.`
          }
        }
        channel.send('', options)
      }
    } else if(args[0] === 'activate' || args[0] === 'add') {
      if(donator.translateAmount(userPatreon, userDatabase) > used) {
        let options = {
          embed: {
            color: colors.blue,
            title: `${emojis.information} **You have Premium**`,
            description: `**Total Balance:** ${dollars}\n` +
                `**Already Used:** $${(used / 100).toFixed(2)}\n\n` +
                `You still have $${(left / 100).toFixed(2)} left. To apply a premium tier to this server, use the command \`${prefix}premium activate <tier>\`.\n` +
                `In case you want to remove a guild from your premium slots, you can use the command \`${prefix}premium deactivate [guild]\` to do so.`
          }
        }
        channel.send('', options)
      } else {
        let options = {
          embed: {
            color: colors.blue,
            title: `${emojis.information} **You have Premium**`,
            description: `**Total Balance:** ${dollars}\n` +
                `**Already Used:** $${(used / 100).toFixed(2)}\n\n` +
                `All entitled tiers are currently in use by other servers. To view them, please use \`${prefix}premium view\``
                `In case you want to remove a guild from your premium slots, you can use the command \`${prefix}premium deactivate [guild]\` to do so.`
          }
        }
        channel.send('', options)
      }
    } else if (args[0] === 'deactivate' || args[0] === 'remove') {
      errors.errorSyntax(msg, prefix, 'premium deactivate <guildId>')
    } else {
      errors.errorSyntax(msg, prefix, module.exports.syntax)
    }
  } else if (args.length >= 2) {
    if(args[0] === 'activate' || args[0] === 'add') {
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
        let thisLeft = left
        guildDatabase.donators.forEach(guildDatabaseDonator => {
          if(guildDatabaseDonator.id === author.id) thisLeft = thisLeft + donator.getTier(guildDatabaseDonator.tier).cost
        })
        if(thisLeft >= tierTier.cost) {
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

          options = {
            embed: {
              color: colors.green,
              title: `${emojis.check} **Premium activated successfully**`,
              description: `You now have enabled \`${tierTier.name}\` for ${guild.name}. Check out \`${prefix}premium view\` to see which servers are currently activated.`
            }
          }
          message.edit('', options)
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
    } else if(args.length === 2 && args[0] === 'deactivate' || args[0] === 'remove') {
      let guildId = args[1];
      let targetGuildDatabase = await Guild.findOne({ id: guildId })
      if(targetGuildDatabase) {
        if(!targetGuildDatabase.donators) targetGuildDatabase.donators = []
        let targetGuildDatabaseDonator = targetGuildDatabase.donators.filter(donator => donator.id === author.id)
        if(targetGuildDatabaseDonator.length >= 1) {
          targetGuildDatabaseDonator = targetGuildDatabaseDonator[0]
          let options = {
            embed: {
              color: colors.blue,
              title: `${emojis.loading} **Deactivating premium...**`
            }
          }
          let message = await channel.send('', options)

          targetGuildDatabase.donators = targetGuildDatabase.donators.slice()
          targetGuildDatabase.donators = targetGuildDatabase.donators.filter(donator => donator.id !== author.id)
          userDatabase.donator.assigned = userDatabase.donator.assigned.slice()
          userDatabase.donator.assigned = userDatabase.donator.assigned.filter(assigned => assigned.id !== targetGuildDatabase.id)

          await targetGuildDatabase.save()
          await userDatabase.save()

          options = {
            embed: {
              color: colors.green,
              title: `${emojis.check} **Premium deactivated successfully**`,
              description: `You now have disabled \`${donator.getTier(targetGuildDatabaseDonator.tier).name}\` for ${targetGuildDatabase.name ? targetGuildDatabase.name : targetGuildDatabase.id}. Check out \`${prefix}premium view\` to see which servers are currently activated.`
            }
          }
          message.edit('', options)
        } else {
          errors.error(msg, `You are not a Donator of guild ${targetGuildDatabase.name ? targetGuildDatabase.name : targetGuildDatabase.id}.\n` +
              `Activate premium first using \`${prefix}premium activate <tier>\` before you can deactivate it.`)
        }
      } else {
        let options = {
          embed: {
            color: colors.red,
            title: `${emojis.xmark} **Guild could not be found!**`,
            description: 'Please enter a valid guild ID. If you don\'t know how to get a guild\'s ID, ' +
                `you can use the command \`${prefix}premium view\` to view all activated guilds and their ID.`
          }
        }
        channel.send('', options)
      }
    }
  }
}

module.exports.name = 'premium'
module.exports.description = 'Use this command to activate and manage your premium.'
module.exports.syntax = 'premium [list|view|activate|deactivate] [tier...|guildId]'
