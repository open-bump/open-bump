const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`./config.${environment}.json`)

const main = require('./bot')
const donator = require('./utils/donator')
const colors = require('./utils/colors')
const emojis = require('./utils/emojis')
const common = require('./utils/common')
const lyne = require('./utils/lyne')
const Guild = require('./models/Guild')
const User = require('./models/User')

module.exports.received = async (msg) => {
  try {
    // Splitting args with " " but not in quotes
    // -> https://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli#16261693
    const author = msg.author

    if(author.bot || author.id === main.client.user.id) return // Returned because of own message

    const guild = msg.guild

    if(!guild) return

    /* Fetch or Create important Guild Information, e.g. Prefix and Features */
    const guildDatabase = await common.getGuildDatabase(guild)

    if(guildDatabase.name !== guild.name) {
      guildDatabase.name = guild.name
      guildDatabase.name_lower = guild.name.toLowerCase()
      guildDatabase.save()
    }

    if(config.discord.closedBeta) {
      if(!donator.translateFeatures(guildDatabase).includes('EARLY_ACCESS') && !config.discord.owners.includes(author.id)) {
        if(msg.content.startsWith('ob!')) {
          let options = {
            embed: {
              color: colors.orange,
              title: 'Early Access Program',
              description: 'We are currently working on a new version of Open Bump. At the moment, only certain servers have access to all features. Other servers don\'t have access to Open Bump at all.\n' +
                  'Because the old version of Open Bump can\'t handle the high amount of requests, we are not able to keep it running until the new version is released. We are very sorry about this and hope you understand it.\n' +
                  '\n' +
                  'We are currently rolling out feature by feature, server by server. It is possible that you see other servers which already have new features.\n' +
                  'If you want to stay updated, please join [Open Advertisements](https://discord.gg/eBFu8HF). There you\'ll get the latest news about Open Bump.'
            }
          }
          msg.channel.send('', options).catch(() => {})
        }
        return
      }
    }
    // Preparing Prefixes
    let var1 = guildDatabase.settings && guildDatabase.settings.prefix ? guildDatabase.settings.prefix.trim() + ' ' : null
    const var2 = config.settings.prefix.trim() + ' '
    const var3 = `${main.client.user}`.trim() + ' '
    const cont = msg.content

    /* Remove Custom Prefix if Server hasn't the required Feature */
    if(!donator.translateFeatures(guildDatabase).includes('PREFIX')) var1 = config.settings.prefix.trim() + ' '

    /* Check which Prefix was used */
    let used = null
    if(var1 != null && cont.startsWith(var1)) {
      used = var1
    } else if (var2 != null && cont.startsWith(var2)) {
      used = var2
    } else if (var3 != null && cont.startsWith(var3)) {
      used = var3
    } else if(var1 != null && cont.startsWith(var1.trim())) {
      used = var1.trim()
    } else if(var2 != null && cont.startsWith(var2.trim())) {
      used = var2.trim()
    } else if(var3 != null && cont.startsWith(var3.trim())) {
      used = var3.trim()
    }

    const prefix = (var1 ? var1 : (var2 ? var2 : var3)).trim()

    if(used) {
      // Check permissions
      if(!msg.channel.permissionsFor(guild.me).has(['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'])) {
        console.log(`${author.tag} tried to execute a command on ${guild.name} in #${msg.channel.name}, but the bot doesn't have enough permissions to respond.`)
        let options = {
          embed: {
            color: colors.red,
            title: `${emojis.xmark} **Bot Permission Error**`,
            description: `Hey there, it looks like you tried to use a command on **${guild.name}** in ${msg.channel}. ` +
                `However, an error occured when I tried to reply to your command - I am missing permissions. ` +
                `Please report this error to an administrator on the server.\n` +
                `\n` +
                `**Required permissions:**\n` +
                `Read Messages, Send Messages and Embed Links`
          }
        }
        return author.send('', options).catch(() => {})
      }

      // Executing command
      let invoke = cont.substr(used.length).split(' ')[0],
          args   = cont.substr(used.length + invoke.length + 1).match(/(".*?"|[^"\r\v ]+)+(?=\s*|\s*$)/g)

      if(!args) args = []

      let argtions = []

      while(args.length >= 1 && args[args.length - 1].startsWith('-')) argtions.unshift(args.pop())

      if(main.commands.has(invoke)) {
        const command = main.commands.get(invoke)
        try {
          await command.run(msg, invoke, args, prefix, guildDatabase, argtions)
        } catch (err) {
          if(argtions.includes('-lyne')) {
            let lynelink = err.stack ? await lyne(err.stack) : null;
            const options = {
              embed: {
                color: 0xff0000,
                title: '**An error occured!**',
                description: `\`\`\`js\n${err}\`\`\`\n` +
                    `**Full Error:** ${lynelink}`
              }
            }
            msg.channel.send('', options)
          } else {
            const options = {
              embed: {
                color: 0xff0000,
                title: '**An error occured!**',
                description: `\`\`\`js\n${err}\`\`\``
              }
            }
            msg.channel.send('', options)
          }
        }
      }
    }
  } catch (err) {
    console.log('Catched Error!')
    console.log(err)
  }
}
