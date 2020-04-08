const main = require('../bot')
const colors = require('../utils/colors')
const errors = require('../utils/errors')
const Guild = require('../models/Guild')
const donator = require('../utils/donator')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel
  if(donator.translateFeatures(guildDatabase).includes('COLOR')) {
    let member = msg.member
    if(!member.hasPermission('MANAGE_GUILD', true, true, true)) return errors.errorPermissions(msg, 'Manage Server')
    if(args.length === 1) {
      if(!(args[0] === 'reset' || args[0] === 'default')) {
        let newColor = args[0]
        let colorCode
        let colorInt

        try {
          if(newColor.length === 6) {
            colorCode = newColor
          } else if(newColor.length === 7 && newColor.startsWith('#')) {
            colorCode = newColor.substr(1)
          } else if(newColor.length === 3) {
            let colorChars = newColor.split(/(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/)
            colorCode = colorChars[0] + colorChars[0] + colorChars[1] + colorChars[1] + colorChars[2] + colorChars[2]
          } else if(newColor.length === 4 && newColor.startsWith('#')) {
            let colorChars = newColor.substr(1).split(/(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/)
            colorCode = colorChars[0] + colorChars[0] + colorChars[1] + colorChars[1] + colorChars[2] + colorChars[2]
          } else if (newColor.length === 5 && newColor.startsWith('0x')) {
            let colorChars = newColor.substr(2).split(/(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/)
            colorCode = colorChars[0] + colorChars[0] + colorChars[1] + colorChars[1] + colorChars[2] + colorChars[2]
          } else if(newColor.length === 8 && newColor.startsWith('0x')) {
            colorCode = newColor.substr(2)
          } else {
            throw new Error('Invalid color code please use a valid Hex color code!')
          }

          if(!colorCode || colorCode.length !== 6) throw new Error('Unknown error occured: Calculated end color code is null or not 6 characters long!')

          colorInt = parseInt(colorCode, 16)
          if(isNaN(colorInt)) throw new Error('ColorInt is NaN!')
        } catch (err) {
          return errors.error(msg, 'Please enter a valid hex code or `reset` to reset the color!')
        }

        guildDatabase.bump.color = colorInt

        await guildDatabase.save()

        let options = {
          embed: {
            color: colors.green,
            title: '**Color has been changed**',
            description: `__**New Color:**__ #${displaySix(colorInt.toString(16))}`,
            thumbnail: {
              url: `https://via.placeholder.com/300/${displaySix(colorInt.toString(16))}/${displaySix(colorInt.toString(16))}`
            }
          }
        }
        msg.channel.send('', options)
      } else {
        guildDatabase.bump.color = -1

        await guildDatabase.save()

        let options = {
          embed: {
            color: colors.green,
            title: '**Color has been changed**',
            description: `__**New Color:**__ Default Color (#${displaySix(colors.openbump.toString(16))})`,
            thumbnail: {
              url: `https://via.placeholder.com/300/${displaySix(colors.openbump.toString(16))}/${displaySix(colors.openbump.toString(16))}`
            }
          }
        }
        msg.channel.send('', options)
      }
    } else {
      errors.errorSyntax(msg, prefix, module.exports.syntax)
    }
  } else {
    errors.errorMissingFeature(msg, 'COLOR')
  }
}

function displaySix(raw) {
  if(!raw.length) return
  while(raw.length < 6) raw = '0' + raw
  return raw
}

module.exports.name = 'setcolor'
module.exports.aliases = ['set-color']
module.exports.restrictions = ['COLOR']
module.exports.description = 'Use this command to set your server\'s color.'
module.exports.syntax = 'setcolor <color|reset>'
