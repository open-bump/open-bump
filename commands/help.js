const main = require('../bot')
const colors = require('../utils/colors')
const emojis = require('../utils/emojis')
const errors = require('../utils/errors')
const common = require('../utils/common')
const donator = require('../utils/donator')

module.exports.run = (msg, invoke, args, prefix, guildDatabase) => {
  if(args.length === 0) {
    let showcase = []
    showcase.push(main.commands.get('help'))
    showcase.push(main.commands.get('preview'))
    showcase.push(main.commands.get('bump'))
    showcase.push(main.commands.get('setdescription'))
    showcase.push(main.commands.get('setinvite'))
    showcase.push(main.commands.get('setchannel'))
    showcase.push(main.commands.get('setprefix'))
    showcase.push(main.commands.get('setbanner'))
    showcase.push(main.commands.get('setcolor'))
    showcase.push(main.commands.get('about'))
    showcase.push(main.commands.get('premium'))

    let fields = []
    showcase.forEach(cmd => {
      if(commandUnlocked(guildDatabase, cmd)) {
        fields.push({
          name: `**${prefix + (cmd.syntax ? cmd.syntax : cmd.name)}**`,
          value: cmd.description ? cmd.description : 'No Description set!',
          inline: false
        })
      } else {
        fields.push({
          name: `**${prefix + (cmd.syntax ? cmd.syntax : cmd.name)}**`,
          value: '*This is a premium command. Check out our store at [https://openbump.com/#premium](https://openbump.com/#premium) to see all available features.*',
          inline: false
        })
      }
    })
    let options = {
      embed: {
        color: colors.green,
        title: emojis.information + ' **Help**',
        fields: fields
      }
    }
    msg.channel.send('', options)
  } else if (args.length === 1) {
    if(main.commands.has(args[0])) {
      let command = main.commands.get(args[0])
      let unlocked = commandUnlocked(guildDatabase, command)
      if(command.restrictions) {
        if(command.restrictions.forEach) {
          command.restrictions.forEach(restriction => {
            if(!donator.translateFeatures(guildDatabase).includes(restriction)) unlocked = false
          })
        } else {
          if(!donator.translateFeatures(guildDatabase).includes(command.restrictions)) unlocked = false
        }
      }
      let description = []
      if(command.syntax) description.push(`**Syntax:** ${command.syntax}`)
      if(command.aliases) description.push(`**Aliases:** ${command.aliases.join(' ')}`)
      description.push(`**Unlocked:** ${unlocked ? emojis.lockOpen : emojis.lock}`)
      if(command.description) description.push(`**Description:**\n${command.description}`)
      let options = {
        embed: {
          color: colors.green,
          title: prefix + command.name,
          description: description.join('\n')
        }
      }
      msg.channel.send('', options)
    } else {
      errors.error(msg, 'That command could not be found. Please check your syntax!')
    }
  } else {
    errors.errorSyntax(msg, prefix, module.exports.syntax)
  }
}

function commandUnlocked(guildDatabase, command) {
  if(!command.restrictions) return true
  return common.includesAll(donator.translateFeatures(guildDatabase), command.restrictions ? command.restrictions : [])
}

module.exports.name = 'help'
module.exports.aliases = ['?']
module.exports.description = 'This command shows a list of other commands.'
module.exports.syntax = 'help [command]'
