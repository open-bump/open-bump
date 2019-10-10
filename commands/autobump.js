const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const bump = require('../utils/bump')
const donator = require('../utils/donator')
const common = require('../utils/common')
const moment = require('moment')
const ms = require('ms')
const Guild = require('../models/Guild')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel
  let notices = []
  if(donator.translateFeatures(guildDatabase).includes('AUTOBUMP')) {
    let member = msg.member
    if(!member.hasPermission('MANAGE_GUILD', true, true, true)) return errors.errorPermissions(msg, 'Manage Server')
    if(args.length === 0) {
      let options = {
        embed: {
          color: colors.blue,
          title: `${emojis.information} **Autobump**`,
          description: `You currently have autobump ${guildDatabase.autoBump ? 'enabled' : 'disabled'}.\n` +
              `Use the command ${guildDatabase.autoBump ? `\`${prefix}autobump off\` to disable it` : `\`${prefix}autobump on\` to enable it`}.`
        }
      }
      channel.send('', options)
    } else if(args.length === 1) {
      let cooldown = donator.translateCooldown(guildDatabase)
      if(args[0] === 'on') {
        guildDatabase.autoBump = true
        guildDatabase.save()
        let options = {
          embed: {
            color: colors.green,
            title: `${emojis.check} **Autobump enabled**`,
            description: `You now have enabled autobump. It will now automatically bump your server every ${ms(cooldown, { long: true })}.`
          }
        }
        channel.send('', options)
      } else if (args[0] === 'off') {
        guildDatabase.autoBump = false
        guildDatabase.save()
        let options = {
          embed: {
            color: colors.green,
            title: `${emojis.check} **Autobump disabled**`,
            description: `You now have disabled autobump. You can now manually bump your server again every ${ms(cooldown, { long: true })}.`
          }
        }
        channel.send('', options)
      } else {
        errors.errorSyntax(msg, prefix, module.exports.syntax)
      }
    } else {
      errors.errorSyntax(msg, prefix, module.exports.syntax)
    }
  } else {
    errors.errorMissingFeature(msg, 'AUTOBUMP')
  }
}

module.exports.name = 'autobump'
module.exports.description = 'Use this command to enable or disable autobump your server.'
module.exports.syntax = 'autobump [on|off]'
