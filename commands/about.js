const main = require('../bot')
const colors = require('../utils/colors')
const errors = require('../utils/errors')
const Guild = require('../models/Guild')
const package = require('../package')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel
  let options = {
    embed: {
      color: colors.green,
      title: '**About Open Bump**',
      description: `**Version:** ${package.version}\n` +
          `**Author:** ${package.author}\n` +
          `**Description:**\n Open Bump allows you to automatically advertise your server on other servers and let them advertise their server on your server.\n` +
          `**Invite this Bot:** [Invite Link](https://discordapp.com/api/oauth2/authorize?client_id=546999467887427604&permissions=281665&scope=bot)\n` +
          `**Support Server:** [https://discord.gg/eBFu8HF](https://discord.gg/eBFu8HF)`
    }
  }
  msg.channel.send('', options)
}

module.exports.name = 'about'
module.exports.aliases = ['invite']
module.exports.description = 'This command shows information about this bot.'
module.exports.syntax = 'about'