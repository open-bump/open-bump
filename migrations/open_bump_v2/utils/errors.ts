const colors = require("./colors");
const emojis = require("./emojis");

module.exports.errorException = (msg, err) => {
  module.exports.errorInternal(msg, `\`\`\`js\n${err}\`\`\``);
};

module.exports.errorInternal = (msg, message) => {
  module.exports.error(msg, `${emojis.xmark} **Internal Error**`, message);
};

module.exports.errorPermissions = (msg, permissions) => {
  let permissionsText =
    "You are missing the following permission" +
    (permissions.size !== 1 ? "s: `" : ": `") +
    (permissions.join ? permissions.join("`, `") : permissions) +
    "`" +
    ".";
  module.exports.error(
    msg,
    `${emojis.xmark} **Permission Error**`,
    permissionsText
  );
};

module.exports.errorBotPermissions = (msg, permissions, channel) => {
  let permissionsText =
    "The bot is missing the following permission" +
    (permissions.size !== 1 ? "s: `" : ": `") +
    (permissions.join ? permissions.join("`, `") : permissions) +
    "`" +
    channel
      ? ` in the channel ${channel}.`
      : ".";
  module.exports.error(
    msg,
    `${emojis.xmark} **Bot Permission Error**`,
    permissionsText
  );
};

module.exports.errorSyntax = (msg, prefix, syntax) => {
  module.exports.error(
    msg,
    `${emojis.xmark} **Syntax Error**`,
    prefix + syntax
  );
};

module.exports.errorMissingFeature = (msg, feature) => {
  module.exports.error(
    msg,
    `${emojis.lockKey} **Premium Feature**`,
    "This is a premium command. Check out our Patreon at [https://patreon.com/Looat](https://www.patreon.com/Looat) to see all available features."
  );
};

module.exports.error = (msg, title, description) => {
  if (!description) {
    description = title;
    title = `${emojis.xmark} **Error**`;
  }
  let options = {
    embed: {
      color: colors.red,
      title: title,
      description: description
    }
  };
  msg.channel.send("", options);
};
