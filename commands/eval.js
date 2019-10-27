const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const common = require('../utils/common')
const bump = require('../utils/bump')
const lyne = require('../utils/lyne')
const Discord = require('discord.js')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase, argtions) => {
  let author = msg.author // eval arg
  if(author.id !== '422373229278003231') return
  let channel = msg.channel
  let guild = msg.guild // eval arg
  let user = author // eval arg
  let member = msg.member // eval arg
  let message = msg // eval arg
  let query = args.join(" ")
  if(query.startsWith('```') && query.endsWith('```')) query = query.substring(3, query.length - 3)
  else if(query.startsWith('```js') && query.endsWith('```')) query = query.substring(5, query.length - 3)
  else if(query.startsWith('```javascript') && query.endsWith('```')) query = query.substring(13, query.length - 3)

  let calledBack = false
  if(args.length === 0) {
    return sendCatch(channel, 'SyntaxError: No arguments passed', argtions)
  }
  try {
    let result = await eval(query)
    if(result && result.then) {
      result.then(result => {
        if(!calledBack) sendSuccess(channel, result, argtions)
        calledBack = true
      })
    } else {
      if(!calledBack) sendSuccess(channel, result, argtions)
      calledBack = true
    }
    if(result && result.catch) {
      result.catch(err => {
        if(!calledBack) sendCatch(channel, err, argtions)
        calledBack = true
      })
    } else if(result && result.error) {
      result.error(err => {
        if(!calledBack) sendCatch(channel, err, argtions)
        calledBack = true
      })
    }
  } catch (err) {
    if(!calledBack) sendCatch(channel, err, argtions)
    calledBack = true
  }
}

async function sendSuccess(channel, result, argtions) {
  if(`${result}`.length < 2000 && !argtions.includes('-lyne')) {
    let options = {
      embed: {
        title: '**Successfully evaluated**',
        color: colors.green,
        description: `\`\`\`js\n${``.replaceAll(`${result}`, '`', '\u200b`\u200b')}\`\`\``
      }
    }
    channel.send('', options)
  } else {
    result = await lyne(`${result}`)
    let options = {
      embed: {
        title: '**Successfully evaluated**',
        color: colors.green,
        description: `__**Full Result:**__ [${result}](${result})`
      }
    }
    channel.send('', options)
  }
}

async function sendCatch(channel, err, argtions) {
  let lyneLink = err.stack ? await lyne(err.stack) : null
  if(`${err}`.length < 2000 && !argtions.includes('-lyne')) {
    let options = {
      embed: {
        title: '**Error while evaluating**',
        color: colors.red,
        description: `\`\`\`js\n${``.replaceAll(`${err}`, '`', '\u200b`\u200b')}\`\`\`` +
            (lyneLink ? `\n__**Full StackTrace:**__ [${lyneLink}](${lyneLink})` : '')
      }
    }
    channel.send('', options)
  } else {
    err = await lyne(`${err}`)
    let options = {
      embed: {
        title: '**Error while evaluating**',
        color: colors.red,
        description: `__**Full Error:**__ [${err}](${err})` +
            (lyneLink ? `\n__**Full StackTrace:**__ [${lyneLink}](${lyneLink})` : '')
      }
    }
    channel.send('', options)
  }
}

module.exports.name = 'eval'
module.exports.aliases = ['evaluate', 'calc', 'calculate']
module.exports.description = 'Use this command to test out code quickly.'
module.exports.syntax = 'eval <code...> [-lyne]'
