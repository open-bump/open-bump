const main = require('../bot')
const colors = require('../utils/colors')
const errors = require('../utils/errors')
const emojis = require('../utils/emojis')
const Guild = require('../models/Guild')
const package = require('../package')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel
  let options = {
    embed: {
      color: colors.blue,
      title: `${emojis.information} **About Open Bump**`,
      description: `**Version:** ${package.version}\n` +
          `**Author:** ${package.author}\n` +
          `**Description:**\n Open Bump allows you to automatically advertise your server on other servers and let them advertise their server on your server.\n` +
          `**Invite this Bot:** [Invite Link](https://discordapp.com/api/oauth2/authorize?client_id=546999467887427604&permissions=281665&scope=bot)\n` +
          `**Support Server:** [Invite Link](https://discord.gg/eBFu8HF)`
    }
  }
  msg.channel.send('', options)
}

module.exports.name = 'about'
module.exports.aliases = ['invite', 'support']
module.exports.description = 'This command shows information about this bot.'
module.exports.syntax = 'about'
