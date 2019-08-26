const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  let options = {
    embed: {
      color: colors.green,
      title: 'Prefix',
      description: `**Current Prefix:** ${prefix}`
    }
  };
  msg.channel.send('', options);
};

module.exports.name = 'prefix';
module.exports.description = 'Use this command to display your server\'s prefix.';
module.exports.syntax = 'prefix';
