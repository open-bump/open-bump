const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  let invite;
  if(guildDatabase.bump && guildDatabase.bump.invite) {
    invite = `[${guildDatabase.bump.invite}](https://discord.gg/${guildDatabase.bump.invite})`;
  } else {
    invite = 'N/A';
  }
  let options = {
    embed: {
      color: colors.green,
      title: 'Invite',
      description: `**Current Invite:** ${invite}`
    }
  };
  msg.channel.send('', options);
};

module.exports.name = 'invite';
module.exports.description = 'Use this command to display your server\'s invite.';
module.exports.syntax = 'invite';
