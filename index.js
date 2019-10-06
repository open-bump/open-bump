const { ShardingManager } = require('discord.js');
const config = require('./config');
const server = require('./server');
const patreon = require('./patreon');

const manager = new ShardingManager('./bot.js', { token: config.discord.token });

manager.spawn(config.discord.shards);
manager.on('launch', shard => console.log(`Launched shard #${shard.id}`));

server.run();
patreon.run();
