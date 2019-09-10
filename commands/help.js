const main = require('./../index');

module.exports.run = (msg, invoke, args, prefix, guildDatabase) => {
  let showcase = [];
  showcase.push(main.commands.get('help'));
  let fields = [];
  showcase.forEach(cmd => {
    fields.push({
      name: `**${prefix + (cmd.syntax ? cmd.syntax : cmd.name)}**`,
      value: cmd.description ? cmd.description : 'No Description set!',
      inline: false
    });
  });
  let options = {
    embed: {
      title: '**Help**',
      fields: fields
    }
  };
  msg.channel.send('', options);
};

module.exports.name = 'help';
module.exports.aliases = ['?'];
module.exports.description = 'This command shows a list of other commands.';
module.exports.syntax = 'help [command]';
