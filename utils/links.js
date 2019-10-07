const main = require('../bot')
const client = main.client

module.exports.channel = (input, guild) => {
  let id = ''.replaceAll(input, /[^0-9]/, '')
  if(guild.channels.has(id)) return guild.channels.get(id)

  guild.channels.forEach(channel => {
    if(`#${channel.name}`.toLowerCase() === input.toLowerCase()) return channel
  })

  guild.channels.forEach(channel => {
    if(channel.name.toLowerCase() === input.toLowerCase()) return channel
  })

  let matching = []
  guild.channels.forEach(channel => {
    if(`#${channel.name.toLowerCase()}`.includes(input.toLowerCase())) matching.push(channel)
  })
  if(matching.length === 1) return matching[0]
  if (matching.length > 1) return 'TOO_MANY_RESULTS'

  return 'NO_RESULTS'
}

// TODO: Continue here
module.exports.user = (input, guild) => {
  let id = ''.replaceAll(input, /[^0-9]/, '')
  if(guild && guild.members.has(id)) return guild.members.get(id).user
  else if(client.users.has(id)) return client.users.get(id)

  if(guild) {
    guild.members.forEach(member => {
      if(member.user.tag === input) return member.user
    })
  } else {
    client.users.forEach(user => {
      if(user.tag === input) return user
    })
  }

  if(guild) {
    guild.members.forEach(member => {
      if(member.user.tag.toLowerCase() === input.toLowerCase()) return member.user
    })
  } else {
    client.users.forEach(user => {
      if(user.tag.toLowerCase() === input.toLowerCase()) return user
    })
  }

  if(guild) {
    guild.members.forEach(member => {
      if(member.user.username.toLowerCase() === input.toLowerCase()) return member.user
    })
  } else {
    client.users.forEach(user => {
      if(user.username.toLowerCase() === input.toLowerCase()) return user
    })
  }

  let matching = []
  if(guild) {
    guild.members.forEach(member => {
      if(member.user.tag.toLowerCase().includes(input.toLowerCase())) matching.push(member.user)
    })
  } else {
    client.users.forEach(member => {
      if(user.tag.toLowerCase().includes(input.toLowerCase())) matching.push(user)
    })
  }
  if(matching.length === 1) return matching[0]
  if (matching.length > 1) return 'TOO_MANY_RESULTS'

  return 'NO_RESULTS'
}
