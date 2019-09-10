const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const links = require('./../utils/links');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  if(args.length >= 1) {
    if(args[0] !== 'reset' && args[0] !== 'default') {
      let newChannel = args[0];

      let channel = links.channel(newChannel, msg.guild);

      if(typeof channel === 'object') {
        guildDatabase.feed = channel.id;

        await guildDatabase.save();

        let options = {
          embed: {
            color: colors.green,
            title: 'Channel has been changed!',
            description: `**New Channel:** ${channel}`
          }
        };
        msg.channel.send('', options);
      } else {
        if(channel === 'TOO_MANY_RESULTS') {
          errors.error(msg, 'Too many matching channels found!');
        } else if(channel === 'NO_RESULTS') {
          errors.error(msg, 'Channel not found!');
        } else {
          errors.error(msg, 'Unknown error while looking for channel!');
        }
      }
    } else {
      guildDatabase.feed = undefined;

      await guildDatabase.save();

      let options = {
        embed: {
          color: colors.green,
          title: 'Channel has been changed!',
          description: `**New Channel:** No Channel`
        }
      };
      msg.channel.send('', options);
    }
  } else {
    errors.errorSyntax(msg, prefix, module.exports.syntax);
  }
};

module.exports.name = 'setchannel';
module.exports.aliases = ['set-channel', 'setbumpchannel', 'set-bump-channel', 'setfeed', 'set-feed'];
module.exports.description = 'Use this command to set your server\'s bump channel.';
module.exports.syntax = 'setchannel <channel|reset>';
