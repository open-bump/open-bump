const main = require('./../index');

module.exports.run = (msg, prefix) => {
  throw 'Random error that I just have thrown ;D';
};

module.exports.name = 'setinvite';
module.exports.aliases = ['set-invite'];
module.exports.description = 'Use this command to set your server\'s invite.';
module.exports.syntax = 'setinvite <invite>';
