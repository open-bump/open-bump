const main = require('../bot')
const colors = require('../utils/colors')
const errors = require('../utils/errors')
const bump = require('../utils/bump')
const Guild = require('../models/Guild')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let guild = msg.guild
  let channel = msg.channel

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
  let options = await bump.getPreviewEmbed(guild, guildDatabase)
  channel.send('', options)
}

module.exports.name = 'preview'
module.exports.aliases = ['show-preview', 'show']
module.exports.description = 'Use this command to preview your server\'s bump embed.'
module.exports.syntax = 'preview'
