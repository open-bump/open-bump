const colors = require('./colors')
const emojis = require('./emojis')
const ms = require('ms')
const common = require('./common')
const Guild = require('../models/Guild')
const donator = require('../utils/donator')

module.exports.bumpToAllShards = async (options) => {
  return common.sharding.bumpToAllShards(options)
}

module.exports.bumpToThisShard = (channels, options) => {
  let amount = 0

  channels.forEach(channels => {
    const main = require('../bot')
    const client = main.client
    let guildId = channels.guild
    let channelId = channels.channel
    if(common.sharding.getGuildShardId(guildId) === main.client.shard.id) {
      let guild = main.client.guilds.get(guildId)
      if(guild) {
        let channel = guild.channels.get(channelId)
        if(channel) {
          if(channel.permissionsFor(guild.me).has(['SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'])) {
            channel.send('', options).catch(() => console.log(`Unknown error occured while trying to bump ${guild.id}!`))
            amount++
          } else {
            console.log(`Guild ${guild.id} has set a bump channel but the bot doesn't have enough permissions to use it!`)
          }
        } else {
          console.log(`Guild ${guild.id} has set a bump channel but it's missing!`)
        }
      }
    }
  })

  return amount
}

module.exports.getPreviewEmbed = async (guild, guildDatabase) => {
  const main = require('../bot')
  const client = main.client
  if(!guild) throw new Error('MissingArgument: guild')
  if(!guildDatabase) guildDatabase = (await Guild.findOrCreate({ id: guild.id })).doc
  if(!guildDatabase.bump) throw new Error('GuildNotReady: bump')
  if(!guildDatabase.bump.description) throw new Error('GuildNotReady: description')
  if(!guildDatabase.bump.invite) throw new Error('GuildNotReady: invite')

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
  if(donator.translateFeatures(guildDatabase).includes('BUMP_CHANNEL')) badges = badges + emojis.bumpChannel + " "
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
