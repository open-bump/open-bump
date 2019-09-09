const main = require('./../index');
const Guild = require('./../models/Guild');

module.exports.bumpToAllShards = async (options) => {
  const guilds = await Guild.find({
    $and: [
      { feed: { $exists: true } },
      { feed: { $ne: null } },
      { feed: { $ne: '' } }
    ]
  });
  console.log(guilds);

  const guilds2 = await Guild.find({});
  console.log(guilds2);
}

module.exports.bumpToThisShard = (channels, options) => {

}
