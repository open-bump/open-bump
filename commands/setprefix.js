const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const emojis = require('./../utils/emojis');
const Guild = require('./../models/Guild');

const common = [
  '!',
  '?',
  '-'
];

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  let notices = [];
  if(guildDatabase.features.includes('PREFIX')) {
    let member = msg.member;
    if(!member.hasPermission('MANAGE_GUILD', true, true, true)) return errors.errorPermissions(msg, 'Manage Server');
    if(args.length >= 1) {
      if(!((args[0] === 'reset' || args[0] === 'default') && args.length === 1)) {
        let newPrefix = args.join(" ");
        if(!guildDatabase.settings) guildDatabase.settings = {};
        guildDatabase.settings.prefix = newPrefix;

        await guildDatabase.save();

        if(common.includes(newPrefix)) {
          notices.push({
            name: `${emojis.bell} **Suggestion: Uniqueness**`,
            value: 'It looks like you use a common prefix. We recommend setting a unique one to prevent interferences.',
            inline: false
          });
        }

        let options = {
          embed: {
            color: colors.green,
            title: '**Prefix has been changed**',
            description: `__**New Prefix:**__ ${newPrefix}`,
            fields: notices
          }
        };
        msg.channel.send('', options);
      } else {
        if(!guildDatabase.settings) guildDatabase.settings = {};
        guildDatabase.settings.prefix = undefined;

        await guildDatabase.save();

        let options = {
          embed: {
            color: colors.green,
            title: `${emojis.check} **Prefix has been changed**`,
            description: `__**New Prefix:**__ Default Prefix (${main.config.settings.prefix})`,
            fields: notices
          }
        };
        msg.channel.send('', options);
      }
    } else {
      errors.errorSyntax(msg, prefix, module.exports.syntax);
    }
  } else {
    errors.errorMissingFeature(msg, 'PREFIX');
  }
};

module.exports.name = 'setprefix';
module.exports.aliases = ['set-prefix'];
module.exports.restrictions = ['PREFIX'];
module.exports.description = 'Use this command to set your server\'s prefix.';
module.exports.syntax = 'setprefix <prefix...|reset>';
