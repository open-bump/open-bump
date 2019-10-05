const { ShardingManager } = require('discord.js');
const config = require('./config');

const manager = new ShardingManager('./bot.js', { token: config.discord.token });

manager.spawn(3);
manager.on('launch', shard => console.log(`Launched shard ${shard.id}`));
