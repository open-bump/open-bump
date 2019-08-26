const colors = require('./colors');
const emojis = require('./emojis');

module.exports.errorException = (msg, err) => {
  module.exports.errorInternal(msg, `\`\`\`js\n${err}\`\`\``);
}

module.exports.errorInternal = (msg, message) => {
  module.exports.error(msg, 'Internal Error', message);
}

module.exports.errorPermissions = (msg, permissions) => {
  let permissionsText = 'You are missing the following permission' + (permissions.size !== 1 ? 's: `' : ': `') + permissions.join('`, `') + '`';
  module.exports.error(msg, 'Permission Error', permissionsText);
}

module.exports.errorSyntax = (msg, prefix, syntax) => {
  module.exports.error(msg, 'Syntax Error', prefix + syntax);
}

module.exports.errorMissingFeature = (msg, feature) => {
  module.exports.error(msg, `${emojis.lock_key} Missing Feature`, feature);
}

module.exports.error = (msg, title, description) => {
  if(!description) {
    description = title;
    title = 'Error';
  }
  let options = {
    embed: {
      color: colors.red,
      title: title,
      description: description
    }
  };
  msg.channel.send('', options);
}