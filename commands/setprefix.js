const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  if(args.length >= 1) {
    try{
      let newPrefix = args.join(" ");
      if(!guildDatabase.settings) guildDatabase.settings = {};
      guildDatabase.settings.prefix = newPrefix;

      await guildDatabase.save();

      let options = {
        embed: {
          color: colors.green,
          title: 'Prefix has been changed!',
          description: `**New Prefix:** ${newPrefix}`
        }
      };
    } catch (err) {
      errors.errorException(msg, err);
    }
  } else {
    errors.errorSyntax(msg, prefix, module.exports.syntax);
  }
};

module.exports.name = 'setprefix';
module.exports.aliases = ['set-prefix'];
module.exports.description = 'Use this command to set your server\'s prefix.';
module.exports.syntax = 'setprefix <prefix...>';
