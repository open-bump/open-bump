const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`../config.${environment}.json`)

const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const common = require('../utils/common')
const bump = require('../utils/bump')
const topgg = require('../utils/topgg')
const Guild = require('../models/Guild')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let guild = msg.guild
  let channel = msg.channel
  let author = msg.author

  if(config.topgg.enabled) {
    let voted = topgg.dbl && await topgg.dbl.hasVoted(author.id)
    let options = {
      embed: {
        color: voted ? colors.green : colors.blue,
        title: `${voted ? emojis.check : emojis.information} **Vote for our bot!**`,
        description: `**Vote Link:** [https://top.gg/bot/546999467887427604/vote](https://top.gg/bot/546999467887427604/vote)\n` +
              `**Status:** ${voted ? 'You already have voted in the last 24 hours' : 'You have not voted yet'}\n` +
              `\n` +
              `By voting for our bot, you can reduce your cooldown by 15 minutes for 24 hours. After 24 hours, just vote again to unlock your super power again!\n`
      }
    }
    return channel.send('', options)
  } else {
    errors.errorInternal(msg, 'Voting is disabled on this environment.')
  }
}

module.exports.name = 'vote'
module.exports.aliases = ['v', 'topgg', 'discordbots', 'botlist']
module.exports.description = 'Use this command to vote for our bot.'
module.exports.syntax = 'vote'
