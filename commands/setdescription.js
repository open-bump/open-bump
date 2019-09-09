const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  if(args.length >= 1) {
    let newDesc = args.join(" ");
    if(!guildDatabase.bump) guildDatabase.bump = {};
    guildDatabase.bump.description = newDesc;

    await guildDatabase.save();

    let options = {
      embed: {
        color: colors.green,
        title: 'Description has been changed!',
        description: `**New Description:**\n` +
            newPrefix
      }
    };
    msg.channel.send('', options);
  } else {
    errors.errorSyntax(msg, prefix, module.exports.syntax);
  }
};

module.exports.name = 'setdescription';
module.exports.aliases = ['set-description', 'setdesc', 'set-desc'];
module.exports.description = 'Use this command to set your server\'s description.';
module.exports.syntax = 'setdescription <description...|reset>';
