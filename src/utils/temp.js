const path = require('path')
const fs = require('fs')
const util = require('util');
const common = require('./common');

const readdir = util.promisify(fs.readdir);

module.exports.mergeDatabase = async () => {
  let amount = 0

  let directoryPath = path.join(__dirname, '../data/merge')
  let guildsDirectoryPath = path.join(directoryPath, './guilds')
  let configFilePath = path.join(directoryPath, './config.json')

  let guildFilesPaths = await readdir(guildsDirectoryPath)
  await common.processArray(guildFilesPaths, async guildFilePath => {
    guildFilePath = path.join(guildsDirectoryPath, guildFilePath)
    let guildFileJson = JSON.parse(fs.readFileSync(guildFilePath, 'utf-8'))
    let id = guildFilePath.split('/').pop()
    id = id.substring(0, id.length - 5)
    console.log(id)
    if(guildFileJson.guild && guildFileJson.description) {
      console.log(`Guild ${id}: ${guildFileJson.description}`)
      let guildDatabase = await common.getGuildDatabase(id)
      // guildDatabase.delete()
      console.log(guildDatabase)
      guildDatabase.bump.description = guildFileJson.description
      await guildDatabase.save()
      amount++
      console.log(guildDatabase)
    }
  })

  let configFileJson = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'))
  console.log(configFileJson)

  Object.keys(configFileJson.bumpservers).forEach(bumpServerKey => {
    let bumpServer = configFileJson.bumpservers[bumpServerKey]
    console.log(bumpServer)
  })

  return `Successfully merged ${amount} documents`
}
