const main = require('./../index');
const client = main.client;
const colors = require('./colors')
const emojis = require('./emojis')
const ms = require('ms');
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

module.exports.bumpToThisShard = async (channels, options) => {

}

module.exports.getPreviewEmbed = async (guild, guildDatabase) => {
  if(!guild) throw new Error('MissingArgument: guild');
  if(!guildDatabase) guildDatabase = (await Guild.findOrCreate({ id: guild.id })).doc;
  if(!guildDatabase.bump) throw new Error('GuildNotReady: bump');
  if(!guildDatabase.bump.description) throw new Error('GuildNotReady: description');
  if(!guildDatabase.bump.invite) throw new Error('GuildNotReady: invite');
  let invite = await client.fetchInvite(guildDatabase.bump.invite);
  if(!(invite && invite.guild && invite.guild.id === guild.id)) throw new Error('ValueNotValid: invite');
  invite = 'https://discord.gg/' + invite.code;
  let regions = await guild.fetchVoiceRegions();
  let region = 'Unknown';
  let color = guildDatabase.bump.color && guildDatabase.bump.color >= 1 && guildDatabase.features.includes('COLOR') ? guildDatabase.bump.color : colors.openbump;
  regions.forEach(regionIndex => region = regionIndex.id === guild.region ? regionIndex.name : region);
  let description = `${emojis.owner} **Owner:** ${guild.owner.user.tag}\n` +
      `${emojis.region} **Region:** ${region}\n` +
      `${emojis.created} **Created:** ${ms(Date.now().valueOf() - guild.createdAt.valueOf(), { long: true })} ago\n` +
      `\n` +
      `${guildDatabase.bump.description}`;
  let options = {
    embed: {
      title: guild.name,
      thumbnail: {
        url: guild.iconURL
      },
      color: color,
      description: description,
      fields: [
        {
          name: `${emojis.slink} Invite Link`,
          value: `**${invite}**`,
          inline: false
        }
      ]
    }
  };
  return options;
}
