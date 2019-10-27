const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const Guild = require('../models/Guild')
const donator = require('../utils/donator')
const filter = require('../utils/filter')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel
  if(donator.translateFeatures(guildDatabase).includes('BANNER')) {
    let member = msg.member
    if(!member.hasPermission('MANAGE_GUILD', true, true, true)) return errors.errorPermissions(msg, 'Manage Server')
    if(args.length === 1) {
      if(!(args[0] === 'reset' || args[0] === 'default')) {
        let newBanner = args.join(" ")

        if (/\.(png|jpg|jpeg|webp|gif)$/.test(newBanner)) {

          let options = {
            embed: {
              color: colors.blue,
              title: emojis.loading + ' **We are checking your image for explicit content...**'
            }
          }
          let message = await channel.send('', options)

          let url = await filter.full(newBanner);

          if(url) {
            guildDatabase.bump.banner = url
            await guildDatabase.save()

            let options = {
              embed: {
                color: colors.green,
                title: `${emojis.check} **Banner has been changed**`,
                description: `__**New Banner:**__ *Image below*`,
                image: {
                  url: newBanner
                }
              }
            }
            message.edit('', options)
          } else {
            let options = {
              embed: {
                color: colors.red,
                title: `${emojis.xmark} **Error while saving banner!**`,
                description: `It looks like your banner contains explicit content. Please try another image.\n` +
                    `If you believe this is an error, please contact our [Support](https://discord.gg/eBFu8HF).`
              }
            }
            message.edit('', options)
          }
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
