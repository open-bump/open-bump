const main = require('../bot');
const colors = require('../utils/colors');
const emojis = require('../utils/emojis');
const errors = require('../utils/errors');
const bump = require('../utils/bump');
const common = require('../utils/common');
const Guild = require('../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let guild = msg.guild;
  let channel = msg.channel;
  try {
    let options = {
      embed: {
        color: colors.blue,
        title: emojis.loading + ' **Your server is beeing bumped...**'
      }
    };
    let message = await channel.send('', options);
    options = await bump.getPreviewEmbed(guild, guildDatabase);
    let amount = await bump.bumpToAllShards(options);
    options = {
      embed: {
        color: colors.green,
        title: emojis.check + ' *Success*',
        description: `Your server has been bumped to \`${amount} Servers\`. It may take some time until your bump is show in every server with a bump channel.`
      }
    }
    message.edit('', options);
  } catch (err) {
    channel.send(`${err}`);
  }
};

module.exports.name = 'bump';
module.exports.description = 'Use this command to bump your server.';
module.exports.syntax = 'bump';
