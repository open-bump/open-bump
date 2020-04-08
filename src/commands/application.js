const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`../config.${environment}.json`)

const main = require('../bot')
const colors = require('../utils/colors')
const errors = require('../utils/errors')
const common = require('../utils/common')
const emojis = require('../utils/emojis')
const lyne = require('../utils/lyne')
const Application = require('../models/Application')
const package = require('../package')
const moment = require('moment')
const mongoose = require('mongoose')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase, argtions) => {
  let channel = msg.channel
  let author = msg.author
  if(args.length === 0) {
    let appsDatabase = await Application.find(config.discord.owners.includes(author.id) ? {} : { owner: author.id })
    let appsString = []
    appsDatabase.forEach(appDatabase => {
      appsString.push(`**${appDatabase.tag}:** ${appDatabase._id}`)
    })
    appsString = appsString.length > 0 ? appsString.join('\n') : 'You don\'t have any applications!'
    let options = {
      embed: {
        color: colors.blue,
        title: `${emojis.information} **Your Applications**`,
        description: (appsString.length <= 2048 && !argtions.includes('-lyne')) ? appsString : `**List:** ${await lyne(appsString)}`
      }
    }
    channel.send('', options)
  } else if (args.length === 1) {
    let appsDatabase = await Application.find(config.discord.owners.includes(author.id) ? { $or: [{ tag: args[0] }, { _id: common.toObjectId(args[0]) ? common.toObjectId(args[0]) : null }] } : { owner: author.id, $or: [{ tag: args[0] }, { _id: common.toObjectId(args[0]) ? common.toObjectId(args[0]) : null }] })
    if(appsDatabase.length === 1) {
      let appDatabase = appsDatabase[0]
      let options = {
        embed: {
          color: colors.blue,
          title: `${emojis.information} **App Information**`,
          description: `**ID:** ${appDatabase._id}\n` +
              `**Tag:** ${appDatabase.tag}\n` +
              `**Owner:** ${await main.client.fetchUser(appDatabase.owner) ? (await main.client.fetchUser(appDatabase.owner)).tag : appDatabase.owner}\n` +
              `**Created:** ${moment(appDatabase.created).format('L')}\n` +
              `**Bot link:** ${appDatabase.bot && await main.client.fetchUser(appDatabase.bot) ? (await main.client.fetchUser(appDatabase.bot)).tag : 'No bot linked'}\n` +
              `**Scopes:** ${appDatabase.scopes.length > 0 ? appDatabase.scopes.join(' ') : 'No scopes granted'}`
        }
      }
      channel.send('', options)
    } else {
      errors.error(msg, 'That application could not be found.')
    }
  } else if(args.length >= 2) {
    if(args.length === 2 && args[0] === 'create') {
      if(config.discord.owners.includes(author.id)) {
        let appDatabase = null
        if(args[1].length >= 2 && args[1].length <= 32) {
          try {
            appDatabase = await Application.create({
              tag: ''.replaceAll(args[1].toLowerCase(), ' ', '-'),
              owner: author.id
            })
          } catch (err) {
            // ignore
          }
          if(appDatabase) {
            let options = {
              embed: {
                color: colors.green,
                title: `${emojis.check} **Application created**`,
                description: `Application \`${appDatabase.tag}\` created successfully.`
              }
            }
            channel.send('', options)
          } else {
            errors.error(msg, 'Error while trying to create the application. Is the tag already in use?')
          }
        } else {
          errors.error(msg, 'The app\'s tag has to be at least 2 characters long and at most 32 characters long.')
        }
      } else {
        errors.error(msg, 'You are not allowed to use this command.')
      }
    } else {
      let appsDatabase = await Application.find(config.discord.owners.includes(author.id) ? { $or: [{ tag: args[0] }, { _id: common.toObjectId(args[0]) ? common.toObjectId(args[0]) : null }] } : { owner: author.id, $or: [{ tag: args[0] }, { _id: common.toObjectId(args[0]) ? common.toObjectId(args[0]) : null }] })
      if(appsDatabase.length === 1) {
        let appDatabase = appsDatabase[0]
        if(args.length === 2 && args[1] === 'showtoken') {
          let reaction = await msg.react(emojis.mailbox)
          let options = {
            embed: {
              color: colors.blue,
              title: `${emojis.information} **Application token**`,
              description: `**Application:** ${appDatabase.tag}\n\`\`\`${appDatabase.token}\`\`\``
            }
          }
          author.send('', options).catch(() => msg.react(common.getEmojiId(emojis.xmark)))
        } else if(args.length === 2 && args[1] === 'resettoken') {
          appDatabase.token = mongoose.Types.ObjectId()
          await appDatabase.save()
          let options = {
            embed: {
              color: colors.blue,
              title: `${emojis.information} **Token resetted**`,
              description: `The token of \`${appDatabase.tag}\` has been resetted.\n` +
                  `Use the command \`${prefix}application ${appDatabase.tag} showToken\` to show the new token.`
            }
          }
          channel.send('', options)
        } else if(args.length === 2 && args[1] === 'delete') {
          if(config.discord.owners.includes(author.id)) {
            await appDatabase.remove()
            let options = {
              embed: {
                color: colors.green,
                title: `${emojis.check} **Application deleted**`,
                description: `Application \`${appDatabase.tag}\` has been deleted.`
              }
            }
            channel.send('', options)
          } else {
            errors.error(msg, 'You are not allowed to use this command.')
          }
        } else if(args.length === 3 && args[1] === 'setbot') {
          if(args[2] === 'reset') {
            appDatabase.bot = undefined
            await appDatabase.save()
            let options = {
              embed: {
                color: colors.green,
                title: `${emojis.check} **Bot link removed**`,
                description: `\`${appDatabase.tag}\` no longer has a bot linked.`
              }
            }
            channel.send('', options)
          } else {
            let botDiscord = await main.client.fetchUser(args[2])
            if(botDiscord) {
              if(botDiscord.bot) {
                appDatabase.bot = botDiscord.id
                await appDatabase.save()
                let options = {
                  embed: {
                    color: colors.green,
                    title: `${emojis.check} **Bot link updated**`,
                    description: `${appDatabase.tag} is now linked to ${botDiscord.tag}.`
                  }
                }
                channel.send('', options)
              } else {
                errors.error(msg, 'The entered ID points to a normal user.')
              }
            } else {
              errors.error(msg, 'Please enter a valid ID.')
            }
          }
        }else if(args.length === 3 && args[1] === 'setowner') {
          if(config.discord.owners.includes(author.id)) {
            if(args[2] === 'reset') {
              appDatabase.bot = undefined
              await appDatabase.save()
              let options = {
                embed: {
                  color: colors.green,
                  title: `${emojis.check} **Bot link removed**`,
                  description: `\`${appDatabase.tag}\` no longer has a bot linked.`
                }
              }
              channel.send('', options)
            } else {
              let ownerDiscord = await main.client.fetchUser(args[2])
              if(ownerDiscord) {
                if(!ownerDiscord.bot) {
                  appDatabase.owner = ownerDiscord.id
                  await appDatabase.save()
                  let options = {
                    embed: {
                      color: colors.green,
                      title: `${emojis.check} **Owner updated**`,
                      description: `${appDatabase.tag}'s new owner is now  ${ownerDiscord.tag}.`
                    }
                  }
                  channel.send('', options)
                } else {
                  errors.error(msg, 'The entered ID points to a bot user.')
                }
              } else {
                errors.error(msg, 'Please enter a valid ID.')
              }
            }
          } else {
            errors.error(msg, 'You are not allowed to use this command.')
          }
        } else if(args.length === 3 && args[1] === 'grant') {
          if(config.discord.owners.includes(author.id)) {
            if(!appDatabase.scopes.includes(args[2].toLowerCase())) appDatabase.scopes.push(args[2].toLowerCase())
            await appDatabase.save()
            let options = {
              embed: {
                color: colors.green,
                title: `${emojis.check} **Scope granted**`,
                description: `${appDatabase.tag} now has access to \`${args[2].toLowerCase()}\`.`
              }
            }
            channel.send('', options)
          } else {
            errors.error(msg, 'You are not allowed to use this command.')
          }
        } else if(args.length === 3 && args[1] === 'deny') {
          if(config.discord.owners.includes(author.id)) {
            if(appDatabase.scopes.includes(args[2].toLowerCase())) common.removeValue(appDatabase.scopes, args[2].toLowerCase())
            await appDatabase.save()
            let options = {
              embed: {
                color: colors.green,
                title: `${emojis.check} **Scope denied**`,
                description: `${appDatabase.tag} lost access to \`${args[2].toLowerCase()}\`.`
              }
            }
            channel.send('', options)
          } else {
            errors.error(msg, 'You are not allowed to use this command.')
          }
        } else {
          errors.errorSyntax(msg, prefix, module.exports.syntax)
        }
      } else {
        errors.error(msg, 'That application could not be found.')
      }
    }
  } else {
    errors.errorSyntax(msg, prefix, module.exports.syntax)
  }
}

module.exports.name = 'application'
module.exports.aliases = ['applications', 'app', 'apps']
module.exports.description = 'This command allows you to manage your applications.'
module.exports.syntax = 'application [name|id|create] [showtoken|resettoken|setbot|setowner|grant|deny|delete] [botid|reset|ownerid|feature]'
