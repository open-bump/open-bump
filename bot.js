// Imports
const Discord = require('discord.js'),
      Guild = require('./models/Guild'),
      client = new Discord.Client(),
      mongoose = require('mongoose'),
      colors = require('./utils/colors');

module.exports.client = client;

// Prototype Changes (not recommended, but the most effective)
String.prototype.replaceAll = (str, search, replacement) => {
  return str && str.replace ? str.replace(new RegExp(search, 'g'), replacement) : str;
};

Object.defineProperty(global, '__stack', {
get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
get: function() {
        return __stack[1].getFunctionName();
    }
});

client.require = (path) => {
  return require(path);
};

// Config
const config = require('./config');
module.exports.config = config;

// Discord
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Commands
const commands = new Discord.Collection();
module.exports.commands = commands;
registerCommand('./commands/about');
registerCommand('./commands/bump');
registerCommand('./commands/eval');
registerCommand('./commands/help');
registerCommand('./commands/prefix');
registerCommand('./commands/preview');
registerCommand('./commands/setbanner');
registerCommand('./commands/setchannel');
registerCommand('./commands/setcolor');
registerCommand('./commands/setdescription');
registerCommand('./commands/setinvite');
registerCommand('./commands/setprefix');
registerCommand('./commands/stats');

function registerCommand(path, name, alias) {
  let command = require(path);
  if(!name) name = command.name;
  if(!name) throw new Error('Trying to register a command that is not a command!');
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

    if(config.discord.closedBeta) {
      if(!guildDatabase.features.includes('EARLY_ACCESS') && !config.discord.owners.includes(author.id)) {
        if(msg.content.startsWith('ob!')) {
          let options = {
            embed: {
              color: colors.orange,
              title: 'Early Access Program',
              description: 'We are currently working on a new version of Open Bump. At the moment, only certain servers have access to all features. Other servers don\'t have access to Open Bump at all.\n' +
                  'Because the old version of Open Bump can\'t handle the high amount of requests, we are not able to keep it running until the new version is released. We are very sorry about this and hope you understand it.\n' +
                  '\n' +
                  'We are currently rolling out feature by feature, server by server. It is possible that you see other servers which already have new features.\n' +
                  'If you want to stay updated, please join [Open Advertisements](https://discord.gg/eBFu8HF). There you\'ll get the latest news about Open Bump.'
            }
          };
          msg.channel.send('', options);
        }
        return;
      }
    }
    // Preparing Prefixes
    let var1 = guildDatabase.settings && guildDatabase.settings.prefix ? guildDatabase.settings.prefix.trim() + ' ' : null;
    const var2 = config.settings.prefix.trim() + ' ';
    const var3 = `${client.user}`.trim() + ' ';
    const cont = msg.content;

    /* Remove Custom Prefix if Server hasn't the required Feature */
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
      let invoke = cont.substr(used.length).split(' ')[0],
          args   = cont.substr(used.length + invoke.length + 1).match(/(".*?"|[^"\r\v ]+)+(?=\s*|\s*$)/g);

      if(!args) args = [];

      let argtions = [];

      while(args.length >= 1 && args[args.length - 1].startsWith('-')) argtions.unshift(args.pop());

      if(commands.has(invoke)) {
        const command = commands.get(invoke);
        try {
          await command.run(msg, invoke, args, prefix, guildDatabase, argtions);
        } catch (err) {
          const options = {
            embed: {
              color: 0xff0000,
              title: '**An error occured!**',
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
mongoose.connect(''.replaceAll(config.database.mongoURI, '%database%', config.database.database), { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Database successfully connected!');
      client.login(config.discord.token);
    })
    .catch(err => { console.log('Error while connecting to database!'); console.log(err) });
