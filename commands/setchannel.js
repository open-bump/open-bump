const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const common = require('../utils/common')
const links = require('../utils/links')
const Guild = require('../models/Guild')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let member = msg.member
  if(!member.hasPermission('MANAGE_GUILD', true, true, true)) return errors.errorPermissions(msg, 'Manage Server')
  let channel = msg.channel
  if(args.length === 1) {
    if(!(args[0] === 'reset' || args[0] === 'default')) {
      let newChannel = args[0]

      let targetChannel = links.channel(newChannel, msg.guild)

      if(typeof targetChannel === 'object') {
        let issues = common.getBumpChannelIssues(targetChannel, guildDatabase)

        if(issues.length === 0) {
          guildDatabase.feed = targetChannel.id

          await guildDatabase.save()

          let options = {
            embed: {
              color: colors.green,
              title: '**Channel has been changed**',
              description: `__**New Channel:**__ ${targetChannel}`
            }
          }
          msg.channel.send('', options)
        } else {
          let issuesFormatted = []
          issues.forEach(issue => issuesFormatted.push(`- ${issue}`))
          let options = {
            embed: {
              color: colors.red,
              title: `${emojis.xmark} Permission Errors`,
              description: `**Please fix these issues for ${targetChannel}:**\n` +
                  issuesFormatted.join('\n')
            }
          }
          channel.send('', options)
        }
      }  else {
        if(targetChannel === 'TOO_MANY_RESULTS') {
          errors.error(msg, 'Too many matching channels found!')
        } else if(targetChannel === 'NO_RESULTS') {
          errors.error(msg, 'Channel not found!')
        } else {
          console.log('Unknown error while looking for channel!')
          console.log(targetChannel)
          errors.error(msg, 'Unknown error while looking for channel!')
        }
      }
    } else {
      guildDatabase.feed = undefined

      await guildDatabase.save()

      let options = {
        embed: {
          color: colors.green,
          title: '**Channel has been changed**',
          description: `__**New Channel:**__ No Channel`
        }
      }
      msg.channel.send('', options)
    }
  } else {
    errors.errorSyntax(msg, prefix, module.exports.syntax)
  }
}

module.exports.name = 'setchannel'
module.exports.aliases = ['set-channel', 'setbumpchannel', 'set-bump-channel', 'setfeed', 'set-feed']
module.exports.description = 'Use this command to set your server\'s bump channel.'
module.exports.syntax = 'setchannel <channel|reset>'
