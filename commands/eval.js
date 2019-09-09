const main = require('./../index');
const colors = require('./../utils/colors');
const errors = require('./../utils/errors');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let channel = msg.channel;
  let author = msg.author;
  let member = msg.member;
  let query = args.join(" ");
  if(query.startsWith('```') && query.endsWith('```')) query = query.substring(3, query.length - 3);
  else if(query.startsWith('```js') && query.endsWith('```')) query = query.substring(5, query.length - 3);
  else if(query.startsWith('```javascript') && query.endsWith('```')) query = query.substring(13, query.length - 3);
  let calledBack = false;
  if(author.id === '422373229278003231') {
    if(args.length === 0) {
      return sendCatch(channel, 'SyntaxError: No arguments passed');
    }
    try {
      let result = eval(query);
      if(result && result.then) {
        result.then(result => {
          if(!calledBack) sendSuccess(channel, result);
          calledBack = true;
        });
      } else {
        if(!calledBack) sendSuccess(channel, result);
        calledBack = true;
      }
      if(result && result.catch) {
        result.catch(err => {
          if(!calledBack) sendCatch(channel, err);
          calledBack = true;
        });
      } else if(result && result.error) {
        result.error(err => {
          if(!calledBack) sendCatch(channel, err);
          calledBack = true;
        });
      }
    } catch (err) {
      if(!calledBack) sendCatch(channel, err);
      calledBack = true;
    }
  }
};

function sendSuccess(channel, result) {
  let options = {
    embed: {
      title: 'Success',
      color: colors.green,
      description: `\`\`\`js\n${``.replaceAll(`${result}`, '`', '\u200b`\u200b')}\`\`\``
    }
  };
  channel.send('', options);
}

function sendCatch(channel, err) {
  let options = {
    embed: {
      title: 'Error',
      color: colors.red,
      description: `\`\`\`js\n${``.replaceAll(`${err}`, '`', '\u200b`\u200b')}\`\`\``
    }
  };
  channel.send('', options);
}

module.exports.name = 'eval';
module.exports.aliases = ['evaluate', 'calc', 'calculate'];
module.exports.description = 'Use this command to test out code quickly.';
module.exports.syntax = 'eval <code...>';
