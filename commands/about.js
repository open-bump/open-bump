const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');
const package = require('../package');

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
      title: '**Invite**',
      description: `__**Current Invite:**__ ${invite}`
    }
  };
  msg.channel.send('', options);
};

module.exports.name = 'about';
module.exports.description = 'This command shows information about this bot.';
module.exports.syntax = 'about';
