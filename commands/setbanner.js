const main = require('../bot')
const colors = require('../utils/colors')
const errors = require('../utils/errors')
const Guild = require('../models/Guild')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel
  if(guildDatabase.features.includes('BANNER')) {
    let member = msg.member
    if(!member.hasPermission('MANAGE_GUILD', true, true, true)) return errors.errorPermissions(msg, 'Manage Server')
    if(args.length === 1) {
      if(!(args[0] === 'reset' || args[0] === 'default')) {
        let newBanner = args.join(" ")

          if (/\.(png|jpg|jpeg|webp|gif)$/.test(newBanner)) {
          guildDatabase.bump.banner = newBanner
          await guildDatabase.save()

          let options = {
            embed: {
              color: colors.green,
              title: '**Banner has been changed**',
              description: `__**New Banner:**__ ${newBanner}`,
              image: {
                url: newBanner
              }
            }
          }
          msg.channel.send('', options)
        } else {
          errors.error(msg, 'We only accept images of the types `.png`, `.jpg` and `.gif`. Please try again with another link.')
        }
      } else {
        guildDatabase.bump.banner = undefined
        await guildDatabase.save()

        let options = {
          embed: {
            color: colors.green,
            title: '**Banner has been changed**',
            description: `__**New Banner:**__ No Banner`
          }
        }
        msg.channel.send('', options)
      }
    } else {
      errors.errorSyntax(msg, prefix, module.exports.syntax)
    }
  } else {
    errors.errorMissingFeature(msg, 'BANNER')
  }
}

module.exports.name = 'setbanner'
module.exports.aliases = ['set-banner']
module.exports.restrictions = ['BANNER']
module.exports.description = 'Use this command to set your server\'s banner.'
module.exports.syntax = 'setbanner <banner|reset>'
