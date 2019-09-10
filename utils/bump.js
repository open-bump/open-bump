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
  let color = guildDatabase.bump.color && guildDatabase.bump.color >= 1 && guildDatabase.features.includes('COLOR') ? guildDatabase.bump.color : colors.openbump;
  // Regions
  let regions = await guild.fetchVoiceRegions();
  let region = 'Unknown';
  regions.forEach(regionIndex => region = regionIndex.id === guild.region ? regionIndex.name : region);

  // Stats
  let total = 0;
  let online = 0;
  let dnd = 0;
  let idle = 0;
  let offline = 0;
  let roles = 0;
  let bots = 0;
  let channels = 0;
  let emotes = 0;

  guild.members.forEach(member => {
    if(member.presence) {
      if(member.presence.status === 'online') {
        online++;
      } else if(member.presence.status === 'dnd') {
        dnd++;
      } else if(member.presence.status === 'idle') {
        idle++;
      }
    }
    if(member.user.bot) bots++;
    total++;
  });
  offline = total - (online + dnd + idle);

  roles = guild.roles.size;
  channels = guild.channels.size;
  emotes = guild.emojis.size;

  // Creating
  let description = `${emojis.owner} **Owner:** ${guild.owner.user.tag}\n` +
      `${emojis.region} **Region:** ${region}\n` +
      `${emojis.created} **Created:** ${ms(Date.now().valueOf() - guild.createdAt.valueOf(), { long: true })} ago\n` +
      `\n` +
      `${guildDatabase.bump.description}`;
  let options = {
    embed: {
      title: `**${guild.name}**`,
      thumbnail: {
        url: guild.iconURL
      },
      color: color,
      description: description,
      fields: [
        {
          name: `${emojis.slink} **Invite Link**`,
          value: `**${invite}**`,
          inline: false
        },
        {
          name: `${emojis.members} **Members [${total}]**`,
          value: `${emojis.online} **Online:** ${online}\n` +
              `${emojis.dnd} **Do Not Disturb:** ${dnd}\n` +
              `${emojis.idle} **Idle:** ${dnd}\n` +
              `${emojis.invisible} **Offline:** ${offline}`,
          inline: true
        },
        {
          name: `${emojis.info} **Misc**`,
          value: `**Roles:** ${roles}\n` +
              `**Bots:** ${bots}\n` +
              `**Channels:** ${channels}\n` +
              `**Emotes:** ${emotes}`,
          inline: true
        }
      ]
    }
  };
  return options;
}
