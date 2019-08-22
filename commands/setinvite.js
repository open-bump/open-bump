const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  if(channel.permissionsFor(msg.guild.me).has('CREATE_INSTANT_INVITE')) {
    try{
      let invite = await channel.createInvite({
        maxAge: 0
      }, `${msg.author.tag} (${msg.author.id$}) changed the invite's channel`);
      if(invite) {
        if(!guildDatabase.bump) guildDatabase.bump = {};
        guildDatabase.bump.invite = invite.code;
        await guildDatabase.save();

        let url = `https://discord.gg/${invite.code}`;
        let options = {
          embed: {
            color: colors.green,
            title: 'Invite has been changed!',
            description: `**New Invite:** [${invite.code}](${url})\n` +
                `**Channel:** ${msg.channel}`
          }
        };
        msg.channel.send('', options);
      } else {
        errors.errorInternal(msg, 'Fetched invite is false');
      }
    } catch (err) {
      errors.errorException(msg, err);
    }
  } else {
    errors.errorPermissions(msg, ['CREATE_INSTANT_INVITE']);
  }
};

module.exports.name = 'setinvite';
module.exports.aliases = ['set-invite'];
module.exports.description = 'Use this command to set your server\'s invite.';
module.exports.syntax = 'setinvite';
