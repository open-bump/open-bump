// Imports
const Discord = require('discord.js'),
      Guild = require('./models/Guild'),
      client = new Discord.Client(),
      mongoose = require('mongoose'),
      apiserver = require('./api');

// Config
const config = require('./config');

// Discord
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Webserver (will be moved to ready event later)
apiserver.run();

// Commands
const commands = new Discord.Collection();
commands.set('help', require('./commands/help'));
commands.set('setinvite', require('./commands/setinvite'));

client.on('message', msg => {
  // Splitting args with " " but not in quotes
  // -> https://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli#16261693
  const author = msg.author;

  if(author.bot || author.id === client.user.id) return; // Returned because of own message

  const guild = msg.guild;

  Guild.findOrCreate({ id: guild.id }).then(guildDatabase => {
    const prefix = guildDatabase.settings && guildDatabase.settings.prefix ? guildDatabase.settings.prefix : config.settings.prefix;

    const cont = msg.content;

    const invoke = cont.split(' ')[0].substr(prefix.length),
          args   = cont.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).slice(1);

    if(commands.has(invoke)) {
      const command = commands.get(invoke);
      try {
        command.run(msg, prefix);
      } catch (err) {
        const options = {
          embed: {
            color: 0xff0000,
            title: 'An error occured!',
            description: `\`\`\`js\n${err}\`\`\``
          }
        };
        msg.channel.send('', options);
      }
    }
  }).catch(err => console.log(`Catched: ${err}`));
});

// Database
mongoose.connect(config.database.mongoURI, { useNewUrlParser: true })
    .then(() => {
      console.log('Database successfully connected!');
      client.login(config.discord.token);
    })
    .catch(err => { console.log('Error while connecting to database!'); console.log(err) });

module.exports.client = client;
module.exports.commands = commands;
