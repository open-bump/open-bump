const main = require('../bot');
const colors = require('../utils/colors');
const errors = require('../utils/errors');
const common = require('../utils/common');
const emojis = require('../utils/emojis');
const Guild = require('../models/Guild');
const package = require('../package');

module.exports.run = async (msg, invoke, args, prefix, guildDatabase) => {
  let author = msg.author; // eval arg
  if(author.id !== '422373229278003231') return;
  let channel = msg.channel;
  if(args.length === 0) {
    let localServers = main.client.guilds.size;
    let localUsers = main.client.users.size;
    let totalServers = (await main.client.shard.fetchClientValues('guilds.size')).reduce((prev, guildCount) => prev + guildCount, 0);
    let totalUsers = (await main.client.shard.fetchClientValues('users.size')).reduce((prev, guildCount) => prev + guildCount, 0);
    let options = {
      embed: {
        color: colors.green,
        title: emojis.information + ' **Open Bump Stats**',
        fields: [
          {
            name: '**Local Stats**',
            value: `**ID:** Shard #${main.client.shard.id}\n` +
                `**Servers:** ${localServers}\n` +
                `**Users:** ${localUsers}`,
            inline: false
          },
          {
            name: '**Global Stats**',
            value: `**Shards:** ${main.client.shard.count} Shard${main.client.shard.count !== 1 ? 's' : ''}\n` +
                `**Servers:** ${totalServers}\n` +
                `**Users:** ${totalUsers}`,
            inline: false
          }
        ]
      }
    };
    msg.channel.send('', options);
  } else if (args.length === 1) {
    try {
      let input = parseInt(args[0]);
      if(input < common.id.min) {
        if(input < 0 || input >= main.client.shard.count) throw new Error();
        let shardServers = (await main.client.shard.broadcastEval(`this.shard.id === ${input} ? this.guilds.size : 0`)).reduce((prev, guildCount) => prev + guildCount, 0);
        let shardUsers = (await main.client.shard.broadcastEval(`this.shard.id === ${input} ? this.users.size : 0`)).reduce((prev, guildCount) => prev + guildCount, 0);
        let options = {
          embed: {
            color: colors.green,
            title: emojis.information + ' **Open Bump Stats**',
            fields: [
              {
                name: '**Shard Stats**',
                value: `**ID:** Shard #${input}\n` +
                    `**Servers:** ${shardServers}\n` +
                    `**Users:** ${shardUsers}`,
                inline: false
              }
            ]
          }
        };
        msg.channel.send('', options);
      } else {
        let guild = await common.sharding.getGuild(input);
        if(!guild) throw new Error();
        let options = {
          embed: {
            color: colors.green,
            title: emojis.information + ' **Open Bump Stats**',
            fields: [
              {
                name: '**Guild Stats**',
                value: `**ID:** ${guild.id}\n` +
                    `**Name:** ${guild.name}\n` +
                    `**Owner:** ${guild.ownerID}\n` +
                    `**Shard:** Shard #${common.sharding.getGuildShardId(guild.id)}`,
                inline: false
              }
            ]
          }
        };
        msg.channel.send('', options);
      }
    } catch (err) {
      errors.error(msg, 'That shard or guild could not be found!');
    }
  } else {
    errors.errorSyntax(msg, syntax);
  }
};

module.exports.name = 'stats';
module.exports.description = 'This command shows stats about this bot.';
module.exports.syntax = 'stats [shard|server]';
