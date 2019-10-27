const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`../config.${environment}.json`)
const main = require('../bot')
const Discord = require('discord.js')

const fetch = require('node-fetch')
const API_URL = 'https://api.deepai.org/api/nsfw-detector'

module.exports.full = async (url, avatar) => {
  url = avatar ? url : await module.exports.clone(url);
  return await module.exports.check(url) ? false : url;
}

module.exports.check = async (url) => {
  const FormData = require('form-data')
  const form = new FormData()
  form.append('image', url)
  let res = await fetch(API_URL, {
    method: 'POST',
    body: form,
    headers: {...form.getHeaders(), 'Api-Key': config.filter.token}
  }).then(res => res.json())
  if(res.err) {
    console.log('Error while filtering images:')
    console.log(res.err)
    return false
  } else {
    if(res.output.detections.length >= 1 || res.output.nsfw_score >= 0.5) return true;
    return false;
  }
}

module.exports.clone = async (url) => {
  let user = await main.client.fetchUser(config.clone.user)
  if(user) {
    let msg = await user.send('', new Discord.Attachment(url, 'image.gif'))
    let attachments = msg.attachments;
    if(attachments) {
      let array = attachments.array();
      let attachment = array[0];
      if(attachment) {
        return attachment.proxyURL;
      }
    }
  }
  return url;
}

module.exports.filterGuild = async (guild, guildDatabase) => {
  let requireSave = false
  if(!guild.icon) {
    if(!guildDatabase.icon || !guildDatabase.icon.granted) {
      guildDatabase.icon = {
        granted: true,
        hash: guild.icon
      }
      requireSave: true
    }
  } else if(!guildDatabase.icon || !guildDatabase.icon.hash || guildDatabase.icon.hash !== guild.icon) {
    guildDatabase.icon = {};
    guildDatabase.icon.hash = guild.icon
    guildDatabase.icon.granted = false

    let url = await module.exports.full(guild.iconURL, true);

    if(url) guildDatabase.icon.granted = true

    requireSave = true
  }
  return requireSave
}
