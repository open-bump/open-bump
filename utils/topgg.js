const config = require('../config')
const main = require('../bot')
const Discord = require("discord.js")
const client = main.client
const DBL = require("dblapi.js")

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
