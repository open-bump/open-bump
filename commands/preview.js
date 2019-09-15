const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const bump = require('./../utils/bump');

  let guild = msg.guild;
  let channel = msg.channel;
  try {
    let options = await bump.getPreviewEmbed(guild, guildDatabase);
    channel.send('', options);
  } catch (err) {
    channel.send(`${err}`);
  }
};

module.exports.name = 'preview';
module.exports.aliases = ['show-preview', 'show'];
module.exports.description = 'Use this command to preview your server\'s bump embed.';
module.exports.syntax = 'preview';
