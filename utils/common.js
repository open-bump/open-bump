const main = require('../bot');

module.exports.id = {
  min: 41943044,
  max: 184467440737095516166
};

module.exports.includesAll = (array, contains) => {
  if(!contains) return true;
  if(!contains.every) return array.includes(contains);
  let success = array.every((val) => {
      return contains.indexOf(val) !== -1;
  });
  return success;
}

module.exports.sharding = {};

module.exports.sharding.getGuildShardId = (guildId) => {
  return ~~((typeof guildId === 'number' ? guildId : parseInt(guildId)) / 4194304 % main.client.shard.count);
}

module.exports.sharding.getGuild = async (guildId) => {
  let shardId = module.exports.sharding.getGuildShardId(guildId);
  let guilds = (await main.client.shard.broadcastEval(`this.shard.id === ${shardId} ? this.guilds.get('${guildId}') : null`));
  if(guilds.length >= 1) return guilds[0];
  return null;
}
