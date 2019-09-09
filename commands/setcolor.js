const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  if(guildDatabase.features.includes('COLOR')) {
    if(args.length == 1) {
      let newColor = args[0];

      let colorInt;
      try {
        if(colorInt.toLowerCase() === 'reset' || colorInt.toLowerCase() === 'default') colorInt = -1;
        else {
          let colorCode;
          if(newColor.length === 6) {
            colorCode = newColor;
          } else if(newColor.length === 7 && newColor.startsWith('#')) {
            colorCode = newColor.substr(1);
          } else if(newColor.length === 3) {
            let colorChars = newColor.split(/(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/);
            colorCode = colorChars[0] + colorChars[0] + colorChars[1] + colorChars[1] + colorChars[2] + colorChars[2];
          } else if(newColor.length === 4 && newColor.startsWith('#')) {
            let colorChars = newColor.substr(1).split(/(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/);
            colorCode = colorChars[0] + colorChars[0] + colorChars[1] + colorChars[1] + colorChars[2] + colorChars[2];
          } else if (newColor.length === 5 && newColor.startsWith('0x')) {
            let colorChars = newColor.substr(2).split(/(?=(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/);
            colorCode = colorChars[0] + colorChars[0] + colorChars[1] + colorChars[1] + colorChars[2] + colorChars[2];
          } else if(newColor.length === 8 && newColor.startsWith('0x')) {
            colorCode = newColor.substr(2);
          } else {
            throw 'Invalid color code; please use a valid Hex color code!'
          }
          if(!colorcode || colorcode.length !== 6) throw 'Unknown error occured: Calculated end color code is not 6 characters long!';
          colorInt = parseInt(colorCode, 16);
        }
      } catch (err) => {
        colorInt = null;
        return errors.error(msg, 'Please enter a valid hex code or `default` to reset the color!');
      }

      if(!guildDatabase.bump) guildDatabase.bump = {};
      guildDatabase.bump.color = colorInt;

      await guildDatabase.save();

      let options = {
        embed: {
          color: colors.green,
          title: 'Color has been changed!',
          description: `**New Color:** #${colorInt.toString(16)}`,
          image: {
            url: `https://via.placeholder.com/300/${colorInt.toString(16)}/${colorInt.toString(16)}`
          }
        }
      };
      msg.channel.send('', options);
    } else {
      errors.errorSyntax(msg, prefix, module.exports.syntax);
    }
  } else {
    errors.errorMissingFeature(msg, 'COLOR');
  }
};

module.exports.name = 'setcolor';
module.exports.aliases = ['set-color'];
module.exports.description = 'Use this command to set your server\'s color.';
module.exports.syntax = 'setcolor <color|reset>';
