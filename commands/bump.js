const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`../config.${environment}.json`)

const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const bump = require('../utils/bump')
const donator = require('../utils/donator')
const common = require('../utils/common')
const moment = require('moment')
const ms = require('ms')
const topgg = require('../utils/topgg')
const Guild = require('../models/Guild')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let guild = msg.guild
  let channel = msg.channel
  let author = msg.author

  if(!donator.translateFeatures(guildDatabase).includes('AUTOBUMP') || !guildDatabase.autoBump) {
    let voted = false

    if(guildDatabase.lastBump && guildDatabase.lastBump.time) {
      let cooldown = donator.translateCooldown(guildDatabase)

      if(topgg.dbl && await topgg.dbl.hasVoted(author.id)) {
        voted = true
        cooldown = cooldown - 1000*60*15;
        if(cooldown < 1000*60*15) cooldown = 1000*60*15;
      }

      let nextBump = moment(guildDatabase.lastBump.time.valueOf() + cooldown)
      if(nextBump.isAfter(moment())) {
        let fields = []
        if(cooldown === 1000*60*60) {
          if(!guildDatabase.lastBump || Math.floor(Math.random() * 3) === 0) {
            fields.push({
              name: `${emojis.bell} **Suggestion: Bump Channel**`,
              value: `You don\'t want to wait ${ms(cooldown, { long: true })} until you can bump? Set your guild a bump channel!\n` +
                  `To set a bump channel, please use the \`${prefix}setchannel <channel>\` command.`,
              inline: false
            })
          } else if(!voted) {
            fields.push({
              name: `${emojis.bell} **Suggestion: Vote**`,
              value: `You don\'t want to wait ${ms(cooldown, { long: true })} until you can bump? Vote for our bot!\n` +
                  `You can vote at [https://top.gg/bot/546999467887427604/vote](https://top.gg/bot/546999467887427604/vote). It will decrease your cooldown by 15 minutes for 24 hours.`,
              inline: false
            })
          }
        } else if(cooldown === 1000*60*45) {
          if(!guildDatabase.lastBump || Math.floor(Math.random() * 3) === 0) {
            fields.push({
              name: `${emojis.bell} **Suggestion: Premium**`,
              value: `You don\'t want to wait ${ms(cooldown, { long: true })} until you can bump? [Upgrade to premium](https://www.patreon.com/Looat) or [boost Open Advertisements](https://discord.gg/eBFu8HF)!\n` +
                  `To view more information about premium, please use the \`${prefix}premium\` command.`,
              inline: false
            })
          } else if(!voted) {
            fields.push({
              name: `${emojis.bell} **Suggestion: Vote**`,
              value: `You don\'t want to wait ${ms(cooldown, { long: true })} until you can bump? Vote for our bot!\n` +
                  `You can vote at [https://top.gg/bot/546999467887427604/vote](https://top.gg/bot/546999467887427604/vote). It will decrease your cooldown by 15 minutes for one hour.`,
              inline: false
            })
          }
        }
        let remaining = ms(nextBump.valueOf() - moment().valueOf(), { long: true })
        let options = {
          embed: {
            color: colors.red,
            title: `${emojis.xmark} **Oops, you are on cooldown!**`,
            description: `**Total Cooldown:** ${ms(cooldown, { long: true })}\n` +
                `**Next Bump:** in ${remaining}`,
            fields: fields
          }
        }
        return channel.send('', options)
      }
    }

    let missing = await bump.isReady(guild, guildDatabase)
    if(missing !== true) {
      let options = {
        embed: {
          color: colors.red,
          title: `${emojis.xmark} **Your guild is not ready yet!**`,
          description: `**Missing:** ${common.niceList(missing)}`,
          fields: [{
            name: `${emojis.bell} **Suggestion: Help Command**`,
            value: `Check out \`ob!help\` to see how to set the missing values above.`,
            inline: false
          }]
        }
      }
      return channel.send('', options)
    }

    let options = {
      embed: {
        color: colors.blue,
        title: emojis.loading + ' **Your server is being bumped...**'
      }
    }
    let message = await channel.send('', options)

    options = await bump.getPreviewEmbed(guild, guildDatabase)
    let amount = await bump.bumpToAllShards(options, false, donator.isDonator(guildDatabase))
    let suggestions = [];
    if (!donator.isDonator(guildDatabase) && !config.shareShards) {
      if(Math.floor(Math.random() * 3) === 0) {
        suggestions.push({
          name: `${emojis.bell} **Suggestion: Cross-Shard-Bumping (Premium)**`,
          value: `Did you know that because of sharding your server only gets bumped to a part of the other servers? ` +
              `If you want to bump your server to all shards and all servers, please check out our [Patreon](https://patreon.com/Looat).`,
          inline: false
        })
      }
    }
    options = {
      embed: {
        color: colors.green,
        title: emojis.check + ' **Success**',
        description: `Your server has been bumped to \`${amount} Servers\`. It may take some time until your bump is shown in every server with a bump channel.`,
        fields: suggestions
      }
    }
    message.edit('', options)
    guildDatabase.lastBump = {}
    guildDatabase.lastBump.user = author.id
    guildDatabase.lastBump.time = Date.now()
    guildDatabase.bumps = guildDatabase.bumps + 1
    guildDatabase.save()
  } else {
    let lastBumpUser = guildDatabase.lastBump && guildDatabase.lastBump.time && guildDatabase.lastBump.user ? await main.client.fetchUser(guildDatabase.lastBump.user) : null
    let options = {
      embed: {
        color: colors.orange,
        title: `${emojis.importantNotice} **Autobump enabled**`,
        description: 'You can\'t manually bump your server because you have autobump enabled.\n' +
            `As long as you have autobump enabled, the bot automatically bumps your server every ${ms(donator.translateCooldown(guildDatabase), { long: true })}.` +
            `${guildDatabase.lastBump && guildDatabase.lastBump.time && guildDatabase.lastBump.user ? `\n\n` +
                `**Last bump:** ${ms(Date.now().valueOf() - guildDatabase.lastBump.time.valueOf(), { long: true })} ago\n` +
                `**Last bump by:** ${lastBumpUser ? lastBumpUser.tag : guildDatabase.lastBump.user}` +
                `` : ''}`
      }
    }
    channel.send('', options)
  }
}

module.exports.name = 'bump'
module.exports.description = 'Use this command to bump your server.'
module.exports.syntax = 'bump'
