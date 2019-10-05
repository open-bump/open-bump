const { ShardingManager } = require('discord.js');
const config = require('./config');

const manager = new ShardingManager('./bot.js', { token: config.discord.token });

manager.spawn(config.discord.shards);
manager.on('launch', shard => console.log(`Launched shard #${shard.id}`));
