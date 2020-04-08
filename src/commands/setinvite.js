const main = require('../bot')
const colors = require('../utils/colors')
const errors = require('../utils/errors')
const Guild = require('../models/Guild')

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let member = msg.member
  if(!member.hasPermission('MANAGE_GUILD', true, true, true)) return errors.errorPermissions(msg, 'Manage Server')
  let channel = msg.channel
  if(channel.permissionsFor(msg.guild.me).has('CREATE_INSTANT_INVITE')) {
    let invite = await channel.createInvite({
      maxAge: 0
    }, `${msg.author.tag} (${msg.author.id$}) changed the invite's channel`)
    if(invite) {
      guildDatabase.bump.invite = invite.code
      await guildDatabase.save()

      let url = `https://discord.gg/${invite.code}`
      let options = {
        embed: {
          color: colors.green,
          title: '**Invite has been changed**',
          description: `__**New Invite:**__ [${invite.code}](${url})\n` +
              `__**Channel:**__ ${msg.channel}`
        }
      }
      msg.channel.send('', options)
    } else {
      errors.errorInternal(msg, 'Fetched invite is false')
    }
  } else {
    errors.errorBotPermissions(msg, ['CREATE_INSTANT_INVITE'])
  }
}

module.exports.name = 'setinvite'
module.exports.aliases = ['set-invite', 'setinv', 'set-inv']
module.exports.description = 'Use this command to set your server\'s invite.'
module.exports.syntax = 'setinvite'
