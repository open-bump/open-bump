// Imports
const Discord = require('discord.js'),
      Guild = require('./models/Guild'),
      client = new Discord.Client(),
      mongoose = require('mongoose'),
      apiserver = require('./api');

// Prototype Changes (not recommended, but the most effective)
String.prototype.replaceAll = (search, replacement) => {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Config
const config = require('./config');

// Discord
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Webserver (got moved to ready event)
  apiserver.run();
});

// Commands
const commands = new Discord.Collection();
registerCommand('./commands/help');
registerCommand('./commands/invite');
registerCommand('./commands/prefix');
registerCommand('./commands/setbanner');
registerCommand('./commands/setinvite');
registerCommand('./commands/setprefix');

function registerCommand(path, name, alias) {
  let command = require(path);
  if(!name) name = command.name;
  if(!name) throw 'Trying to register a command that is not a command!';
  commands.set(name, command);
  if(!alias && command.aliases) {
    command.aliases.forEach(alias => {
      registerCommand(path, alias, true);
    });
  }
}

client.on('message', async msg => {
  try {
    // Splitting args with " " but not in quotes
    // -> https://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli#16261693
    const author = msg.author;

    if(author.bot || author.id === client.user.id) return; // Returned because of own message

    const guild = msg.guild;

    /* Fetch or Create important Guild Information, e.g. Prefix and Features */
    const guildDatabase = (await Guild.findOrCreate({ id: guild.id })).doc;

    // Preparing Prefixes
    let var1 = guildDatabase.settings && guildDatabase.settings.prefix ? guildDatabase.settings.prefix.trim() + ' ' : null;
    const var2 = config.settings.prefix.trim() + ' ';
    const var3 = `${client.user}`.trim() + ' ';
    const cont = msg.content;

    /* Remove Custom Prefix if Server hasn't the requried Feature */
    if(!guildDatabase.features.includes('PREFIX')) var1 = config.settings.prefix.trim() + ' ';

    /* Check which Prefix was used */
    let used = null;
    if(var1 != null && cont.startsWith(var1)) {
      used = var1;
    } else if (var2 != null && cont.startsWith(var2)) {
      used = var2;
    } else if (var3 != null && cont.startsWith(var3)) {
      used = var3;
    } else if(var1 != null && cont.startsWith(var1.trim())) {
      used = var1.trim();
    } else if(var2 != null && cont.startsWith(var2.trim())) {
      used = var2.trim();
    } else if(var3 != null && cont.startsWith(var3.trim())) {
      used = var3.trim();
    }

    const prefix = (var1 ? var1 : (var2 ? var2 : var3)).trim();

    if(used) {
      const invoke = cont.substr(used.length).split(' ')[0],
            args   = cont.substr(used.length + invoke.length + 1).match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);

      if(commands.has(invoke)) {
        const command = commands.get(invoke);
        try {
          await command.run(msg, invoke, args, prefix, guildDatabase);
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
    }
  } catch (err) {
    console.log('Catched Error!');
    console.log(err);
  }
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
