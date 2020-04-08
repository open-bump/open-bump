const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`./config.${environment}.json`)

// Imports
const { ShardingManager } = require('discord.js')
const server = require('./server')
const patreon = require('./patreon')
const mongoose = require('mongoose')
const common = require('./utils/common')

console.log(`Starting Open Bump with environment ${environment}...`);

common.setConsolePrefix('Managing')

const manager = new ShardingManager('./bot.js', { token: config.discord.token, shardArgs: [environment] })
module.exports.manager = manager

// Prototype Changes (not recommended, but the most effective)
String.prototype.replaceAll = (str, search, replacement) => {
  return str && str.replace ? str.replace(new RegExp(search, 'g'), replacement) : str
}

manager.on('launch', shard => console.log(`Launched shard #${shard.id}`))
manager.spawn(config.discord.shards)

// Database
mongoose.connect(''.replaceAll(config.database.mongoURI, '%database%', config.database.database), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(() => {
  console.log('Database on index successfully connected!')

  if(config.patreon.enabled) patreon.run()
  if(config.server.enabled) server.run()
}).catch(err => { console.log('Error while connecting to database!'); console.log(err) })
