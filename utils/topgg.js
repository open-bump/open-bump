const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment;
const config = require(`../config.${environment}.json`)

const main = require('../bot')
const Discord = require("discord.js")
const client = main.client
const DBL = require("dblapi.js")

module.exports.dbl = null;

module.exports.init = () => {
  console.log('Starting topgg...')
  module.exports.dbl = new DBL(config.topgg.token)

  // Optional events
  module.exports.dbl.on('posted', () => {
    console.log('Server count posted!')
  })

  module.exports.dbl.on('error', e => {
   console.log(`Oops! ${e}`)
  })

  console.log('topgg started')
}
