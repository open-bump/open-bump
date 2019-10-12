const colors = require('./colors')
const emojis = require('./emojis')
const config = require('../config')
const ms = require('ms')
const moment = require('moment')
const common = require('./common')
const Guild = require('../models/Guild')
const donator = require('../utils/donator')

let justRemoved = {}

module.exports.bumpToAllShards = async (options, index) => {
  return common.sharding.bumpToAllShards(options, index)
}

module.exports.bumpToThisShard = (channels, options) => {
  let amount = 0

  channels.forEach(channels => {
    const main = require('../bot')
    const client = main.client
    let guildId = channels.guild
    let channelId = channels.channel
    if(common.sharding.getGuildShardId(guildId) === main.client.shard.id && main.client.guilds.has(guildId)) {
      let guild = main.client.guilds.get(guildId)
      if(guild) {
        let channel = guild.channels.get(channelId)
        if(channel) {
          let issues = common.getBumpChannelIssues(channel)
          let issuesFormatted = []
          issues.forEach(issue => issuesFormatted.push(`- ${issue}`))
          if(issues.length === 0) {
            channel.send('', options).catch(() => console.log(`Unknown error occured while trying to bump ${guild.id}!`))
            amount++
          } else {
            if(!justRemoved[guild.id]) {
              justRemoved[guild.id] = true
              setTimeout(() => justRemoved[guild.id] = undefined, 1000*30)
              console.log(`Guild ${guild.name} (${guild.id}) has set a bump channel but there are permission errors!`)
              Guild.findOrCreate({ id: guild.id }, { id: guild.id, name: guild.name, name_lower: guild.name.toLowerCase() }).then(guildDatabase => {
                guildDatabase = guildDatabase.doc
                guildDatabase.feed = undefined
                guildDatabase.save()
              })
              let options = {
                embed: {
                  color: colors.red,
                  title: `${emojis.xmark} **Permission Errors**`,
                  description: 'Hey there, we tried to bump to your bump channel. However, we had some issues.',
                  fields: [{
                    name: '**Issues**',
                    value: `**Please fix these issues for ${channel} and set the bump channel again:**\n` +
                        issuesFormatted.join('\n')
                  }]
                }
              }
              guild.owner.user.send('', options).catch(() => {})
            }
          }
        } else {
          if(!justRemoved[guild.id]) {
            justRemoved[guild.id] = true
            setTimeout(() => justRemoved[guild.id] = undefined, 1000*30)
            console.log(`Guild ${guild.name} (${guild.id}) has set a bump channel but it's missing!`)
            Guild.findOrCreate({ id: guild.id }, { id: guild.id, name: guild.name, name_lower: guild.name.toLowerCase() }).then(guildDatabase => {
              guildDatabase = guildDatabase.doc
              guildDatabase.feed = undefined
              guildDatabase.save()
            })
            let options = {
              embed: {
                color: colors.red,
                title: `${emojis.xmark} **Channel not found**`,
                description: 'Hey there, we tried to bump to your bump channel. However, we were not able to find the channel you\'ve set.\n' +
                    `Please fix this issue by setting a new bump channel using \`${config.settings.prefix}setchannel <channel>\`.`
              }
            }
            guild.owner.user.send('', options).catch(() => {})
          }
        }
      }
    }
  })

  return amount
}

module.exports.bumpToAllShardsIfCorrectShard = async (guildId) => {
  const main = require('../bot')
  if(!main.client.guilds.has(guildId)) return
  let guild = main.client.guilds.get(guildId)
  let guildDatabase = await Guild.findOne({ id: guildId })
  try {
    options = await module.exports.getPreviewEmbed(guild, guildDatabase)
    let amount = await module.exports.bumpToAllShards(options)
    return amount
  } catch (error) {
    return 0
  }
}

module.exports.autoBumpLoop = async () => {
  const main = require('../bot')
  console.log(`Shard #${main.client.shard.id} is now doing autobumps...`)

  try {
    let guildsDatabase = await Guild.find({ autoBump: true })
    common.processArray(guildsDatabase, async guildDatabase => {
      let features = donator.translateFeatures(guildDatabase)
      let cooldown = donator.translateCooldown(guildDatabase)
      if(features.includes('AUTOBUMP')) {
        if(guildDatabase.lastBump && guildDatabase.lastBump.time) {
          let nextBump = moment(guildDatabase.lastBump.time.valueOf() + cooldown)
          if(nextBump.isAfter(moment())) {
            console.log(`Guild ${guildDatabase.name ? guildDatabase.name : guildDatabase.id} skipped as it is on cooldown`)
            return
          }
        }

        console.log(`Guild ${guildDatabase.name ? guildDatabase.name : guildDatabase.id} is now being autobumped`)
        await main.client.shard.broadcastEval(`this.require('./utils/bump').bumpToAllShardsIfCorrectShard('${guildDatabase.id}')`)

        guildDatabase.lastBump.user = main.client.user.id
        guildDatabase.lastBump.time = Date.now()

        guildDatabase.save()
      } else {
        guildDatabase.autoBump = false
        guildDatabase.save()
      }
    })
  } catch (error) {
    console.log('Error while autobumping!')
    console.log(error)
  }

  setTimeout(() => module.exports.autoBumpLoop(), 1000*60*main.client.shard.count)
}

module.exports.isReady = async (guild, guildDatabase) => {
  let missing = []
  if(!guild) throw new Error('MissingArgument: guild')
  if(!guildDatabase) guildDatabase = (await Guild.findOrCreate({ id: guild.id })).doc
  if(!guildDatabase.bump) return ['Description', 'Invite']
  if(!guildDatabase.bump.description) missing.push('Description')
  if(!guildDatabase.bump.invite) missing.push('Invite')
  return missing.length === 0 ? true : missing
}

module.exports.getPreviewEmbed = async (guild, guildDatabase) => {
  const main = require('../bot')
  const client = main.client
  if(await module.exports.isReady(guild, guildDatabase) !== true) throw new Error('BumpError: Guild not ready')

  // Stats
  let total = 0
  let online = 0
  let dnd = 0
  let idle = 0
  let offline = 0
  let roles = 0
  let bots = 0
  let channels = 0
  let emotes = 0

  guild.members.forEach(member => {
    if(member.presence) {
      if(member.presence.status === 'online') {
        online++
      } else if(member.presence.status === 'dnd') {
        dnd++
      } else if(member.presence.status === 'idle') {
        idle++
      }
    }
    if(member.user.bot) bots++
    total++
  })
  offline = total - (online + dnd + idle)

  roles = guild.roles.size
  channels = guild.channels.size
  emotes = guild.emojis.size

  // Invite
  let invite = await client.fetchInvite(guildDatabase.bump.invite)
  if(!(invite && invite.guild && invite.guild.id === guild.id)) throw new Error('ValueNotValid: invite')
  invite = 'https://discord.gg/' + invite.code

  // Color
  let color = guildDatabase.bump.color && guildDatabase.bump.color >= 1 && donator.translateFeatures(guildDatabase).includes('COLOR') ? guildDatabase.bump.color : colors.openbump

  // Region
  let regions = await guild.fetchVoiceRegions()
  let region = 'Unknown'
  regions.forEach(regionIndex => region = regionIndex.id === guild.region ? regionIndex.name : region)

  // Banner
  let banner = donator.translateFeatures(guildDatabase).includes('BANNER') && guildDatabase.bump.banner ? guildDatabase.bump.banner : undefined

  // Featured
  let badges = ""
  if(donator.translateFeatures(guildDatabase).includes('EARLY_SUPPORTER')) badges = badges + emojis.earlySupporter + " "
  if(donator.translateFeatures(guildDatabase).includes('FEATURED')) badges = badges + emojis.featured + " "
  if(guildDatabase.feed || donator.translateFeatures(guildDatabase).includes('BUMP_CHANNEL')) badges = badges + emojis.bumpChannel + " "
  if(donator.translateFeatures(guildDatabase).includes('UNITED_SERVER')) badges = badges + emojis.unitedServer + " "
  if(donator.translateFeatures(guildDatabase).includes('AFFILIATED')) badges = badges + emojis.affiliatedServer + " "

  if(badges != "") badges = " | " + badges

  // Creating
  let description = `${emojis.owner} **Owner:** ${guild.owner.user.tag}\n` +
      `${emojis.region} **Region:** ${region}\n` +
      `${emojis.created} **Created:** ${ms(Date.now().valueOf() - guild.createdAt.valueOf(), { long: true })} ago\n` +
      `\n` +
      `${guildDatabase.bump.description}`
  let options = {
    embed: {
      title: `**${guild.name}**${badges}`,
      thumbnail: {
        url: guild.iconURL
      },
      color: color,
      description: description,
      fields: [
        {
          name: `${emojis.slink} **Invite Link**`,
          value: `**${invite}**`,
          inline: false
        },
        {
          name: `${emojis.members} **Members [${total}]**`,
          value: `${emojis.online} **Online:** ${online}\n` +
              `${emojis.dnd} **Do Not Disturb:** ${dnd}\n` +
              `${emojis.idle} **Idle:** ${idle}\n` +
              `${emojis.invisible} **Offline:** ${offline}`,
          inline: true
        },
        {
          name: `${emojis.info} **Misc**`,
          value: `**Roles:** ${roles}\n` +
              `**Bots:** ${bots}\n` +
              `**Channels:** ${channels}\n` +
              `**Emotes:** ${emotes}`,
          inline: true
        }
      ],
      image: {
        url: banner
      }
    }
  }
  return options
}
