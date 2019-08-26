const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');
const Guild = require('./../models/Guild');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  if(guildDatabase.features.includes('BANNER')) {
    if(args.length >= 1) {
      let newBanner = args.join(" ");

      if (/\.(png|jpg|jpeg|webp|gif)$/.test(newBanner)) {
        if(!guildDatabase.bump) guildDatabase.bump = {};
        guildDatabase.bump.banner = newBanner;

        await guildDatabase.save();

        let options = {
          embed: {
            color: colors.green,
            title: 'Banner has been changed!',
            description: `**New Banner:** ${newBanner}`,
            image: {
              url: newBanner
            }
          }
        };
        msg.channel.send('', options);
      } else {
        errors.error(msg, 'We only accept images of the types `.png`, `.jpg` and `.gif`. Please try again with another link.');
      }
    } else {
      errors.errorSyntax(msg, prefix, module.exports.syntax);
    }
  } else {
    errors.errorMissingFeature(msg, 'BANNER');
  }
};

module.exports.name = 'setbanner';
module.exports.aliases = ['set-banner'];
module.exports.description = 'Use this command to set your server\'s banner.';
module.exports.syntax = 'setbanner <banner...>';
