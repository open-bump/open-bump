const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const emojis = require('./../utils/emojis');
const Guild = require('./../models/Guild');

const regexLib = {
  get emoji() {
    return /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]|<a?:[^<:>]{2,32}:[0-9]{17,19}>/u;
  },
  get markdown() {
    return /\*\*?[^\*]{0,}\*\*?|__[^_]{0,}__|~~[^~]{0,}~~|^>|\n>|`[^`]{0,}`|```[^`]{0,}```/u;
  }
}

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  let notices = [];
  if(args.length >= 1) {
    if(!((args[0] === 'reset' || args[0] === 'default') && args.length === 1)) {
      let newDesc = args.join(" ");

      guildDatabase.bump.description = newDesc;
      await guildDatabase.save();

      if(newDesc.length <= 1536) {
        if(newDesc.length < 128) {
          notices.push({
            name: `${emojis.bell} **Suggestion: Length**`,
            value: 'We recommend choosing a description of at least 128 characters so that potential members know what your server is about.',
            inline: false
          });
        }
        if(newDesc.length > 1024) {
          notices.push({
            name: `${emojis.bell} **Suggestion: Length**`,
            value: 'Your description is very long. We recommend choosing a description of at most 1024 characters so that your text is easier to read.',
            inline: false
          });
        }
        if(!regexLib.emoji.test(` Placeholder ${newDesc} Placeholder `)) {
          notices.push({
            name: `${emojis.bell} **Suggestion: Emojis**`,
            value: 'Your text doesn\'t have any emojis. We recommend adding some so that your text looks more colorful and fancy.',
            inline: false
          });
        }
        if(!regexLib.markdown.test(` Placeholder ${newDesc} Placeholder `)) {
          notices.push({
            name: `${emojis.bell} **Suggestion: Formattings**`,
            value: 'Your text doesn\'t have any formattings. We recommend adding formattings so that your text looks more attractive.',
            inline: false
          });
        }

        let options = {
          embed: {
            color: colors.green,
            title: `${emojis.check} **Description has been changed**`,
            description: `__**New Description:**__\n` +
                newDesc,
            fields: notices
          }
        };
        msg.channel.send('', options);
      } else {
        errors.error(msg, 'The maximum description length allowed is 1536 characters. Make sure to shorten your ad, so much text isn\'t good anyway.');
      }
    } else {
      guildDatabase.bump.description = undefined;
      await guildDatabase.save();

      notices.push({
        name: `${emojis.importantNotice} **Important Notice: Description required**`,
        value: 'Please note that you need to set your description again if you want to continue using this bot.',
        inline: false
      });

      let options = {
        embed: {
          color: colors.green,
          title: `${emojis.check} **Description has been changed**`,
          description: `__**New Description:**__ No Description`,
          fields: notices
        }
      };
      msg.channel.send('', options);
    }
  } else {
    errors.errorSyntax(msg, prefix, module.exports.syntax);
  }
};

module.exports.name = 'setdescription';
module.exports.aliases = ['set-description', 'setdesc', 'set-desc'];
module.exports.description = 'Use this command to set your server\'s description.';
module.exports.syntax = 'setdescription <description...|reset>';
