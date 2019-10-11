const { ShardingManager } = require('discord.js')
const config = require('./config')
const server = require('./server')
const patreon = require('./patreon')
const mongoose = require('mongoose')

const manager = new ShardingManager('./bot.js', { token: config.discord.token })
module.exports.manager = manager

// Prototype Changes (not recommended, but the most effective)
String.prototype.replaceAll = (str, search, replacement) => {
  return str && str.replace ? str.replace(new RegExp(search, 'g'), replacement) : str
}

manager.spawn(config.discord.shards)
manager.on('launch', shard => console.log(`Launched shard #${shard.id}`))

// Database
mongoose.connect(''.replaceAll(config.database.mongoURI, '%database%', config.database.database), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(() => {
  console.log('Database on index successfully connected!')

  patreon.run()
  server.run()
}).catch(err => { console.log('Error while connecting to database!'); console.log(err) })
