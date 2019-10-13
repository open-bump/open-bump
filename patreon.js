const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')
const patreon = require('patreon')
const patreonAPI = patreon.patreon
const common = require('./utils/common')
const donator = require('./utils/donator')
const colors = require('./utils/colors')
const emojis = require('./utils/emojis')
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'))
const CLIENT_ID = config.patreon.clientId
const CLIENT_SECRET = config.patreon.clientSecret
const REFRESH_TOKEN = config.patreon.refreshToken
const BASE_URL = ''
let accessToken = null
let client = null
const Guild = require('./models/Guild')
const User = require('./models/User')

let cache = {
  user: {
    index: null
  },
  campaign: {
    index: null,
    members: {
      index: {}
    }
  }
}

module.exports.run = async (tries) => {
  try {
    await module.exports.init();
    await module.exports.refresh();
  } catch (error) {
    console.log('Error while trying to access Patreon\'s API!')
    console.log(error)
    if (!tries || tries < 5) setTimeout(module.exports.run(tries ? tries + 1 : 1), 1000*5)
    else if (tries < 8) setTimeout(module.exports.run(tries ? tries + 1 : 1), 1000*10)
    else if (tries < 10) setTimeout(module.exports.run(tries ? tries + 1 : 1), 1000*30)
  }
}

module.exports.init = async () => {
  console.log('Starting patreon services...')
  await fetchAccessToken()
  console.log(`Refresh Token: ${refreshToken}`)
  console.log(`Access Token: ${accessToken}`)

  let campaign = await getCampaign()
  if(campaign) cache.campaign.index = campaign
}

module.exports.refresh = async () => {
  let members = await getCampaignMembers()
  if(members) {
    let users = []
    await common.processArray(members.included, async user => {
      if(user) users[user.id] = user
    })
    await common.processArray(members.data, async member => {
      let userId = member.relationships.user.data.id
      let user = users[userId]
      if(member) {
        if(user) member.user = user
        cache.campaign.members.index[member.id] = member
      }
    })
  }
}

module.exports.getPatreonUser = (discordId) => {
  let membersReturn = []
  Object.keys(cache.campaign.members.index).forEach(id => {
    let memberPatreon = cache.campaign.members.index[id]
    let discordConnection = memberPatreon.user.attributes.social_connections.discord
    if(discordConnection) {
      let discordConnectionId = discordConnection.user_id
      if(discordConnectionId && discordConnectionId === discordId) membersReturn.push(memberPatreon)
    }
  })
  let cents = 0;
  let pledges = [];
  membersReturn.forEach(memberReturn => {
    cents = cents + memberReturn.attributes.currently_entitled_amount_cents
    pledges.push({
      email: memberReturn.attributes.email,
      name: memberReturn.attributes.full_name,
      state: memberReturn.attributes.patron_status,
      cents: memberReturn.attributes.currently_entitled_amount_cents
    })
  })
  return {
    id: discordId,
    pledges: pledges,
    cents: cents
  }
}

async function fetchAccessToken() {
  // POST www.patreon.com/api/oauth2/token
  //   ?grant_type=refresh_token
  //   &refresh_token=<the user‘s refresh_token>
  //   &client_id=<your client id>
  //   &client_secret=<your client secret>
  const form = new FormData()
  form.append('grant_type', 'refresh_token')
  form.append('refresh_token', REFRESH_TOKEN)
  form.append('client_id', CLIENT_ID)
  form.append('client_secret', CLIENT_SECRET)

  let res = await fetch('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  }).then(res => res.json())

  if(!res.refresh_token) throw new Error(JSON.stringify(res, null, 2))

  refreshToken = res.refresh_token
  accessToken = res.access_token
  client = patreonAPI(accessToken)
  config.patreon.refreshToken = refreshToken
  fs.writeFileSync("./config.json", JSON.stringify(config, null, 2))

  setTimeout(() => fetchAccessToken(), 1000*60*60*24)  // Refresh it every day to make sure it stays fresh
}

async function getCampaign() {
  let res = await fetch(`https://www.patreon.com/api/oauth2/v2/campaigns/${config.patreon.campaign}`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }).then(res => res.json())
  return res
}

async function getCampaignMembers() {
  let res = await fetch(`https://www.patreon.com/api/oauth2/v2/campaigns/${config.patreon.campaign}/members?fields%5Bmember%5D=full_name,email,patron_status,currently_entitled_amount_cents&include=user&fields%5Buser%5D=full_name,social_connections`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }).then(res => res.json())
  return res
}

async function getMember(id) {
  let res = await fetch(`https://www.patreon.com/api/oauth2/v2/members/${id}?include=email`, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }).then(res => res.json())
  return res
}

async function get(path) {
  return fetch(path)/*.then(res => res.json())*/
}

module.exports.checkPatreonLoop = async () => {
  const main = require('./bot')
  console.log(`Shard #${main.client.shard.id} is now doing patreon checks...`)

  try {
    if(main.client.guilds.has(config.discord.server)) {
      let guild = main.client.guilds.get(config.discord.server)
      refreshNitroBoosters(guild)
    }
  } catch (error) {
    console.log('Error while checking for Nitro Boosters:')
    console.log(error)
  }

  try {
    let userPatreon = await fetch(`http://localhost:3000/api/patreon/user/undefined?fetch=true`, {
      headers: {
        authorization: `Bearer ${config.server.token}`
      }
    }).then(res => res.json())
    console.log('Patreon refetched')

    let usersDatabase = await User.find({ 'donator.amount': { $gt: 0 } })
    await common.processArray(usersDatabase, async userDatabase => {
      let userPatreon = await fetch(`http://localhost:3000/api/patreon/user/${userDatabase.id}`, {
        headers: {
          authorization: `Bearer ${config.server.token}`
        }
      }).then(res => res.json())
        try {
          if(main.client.guilds.has(config.discord.server)) {
            let guild = main.client.guilds.get(config.discord.server)
            refreshPatreonRoles(guild, userDatabase, userPatreon)
          }
        } catch (error) {
          console.log('Error while checking patreon roles')
          console.log(error)
        }
      if(userDatabase.donator.amount <= userPatreon) userDatabase.donator.amount = donator.translateAmount(userPatreon, userDatabase)
      let guildsDatabase = await Guild.find({ 'donators.id': userDatabase.id })
      let totalCost = 0
      guildsDatabase.forEach(guildDatabase => {
        if(!guildsDatabase.donators) guildsDatabase.donators = []
        let guildDatabaseDonator = guildDatabase.donators.filter(donator => donator.id === userDatabase.id)
        if(guildDatabaseDonator.length >= 1) {
          guildDatabaseDonator = guildDatabaseDonator[0]
          totalCost = totalCost + donator.getTier(guildDatabaseDonator.tier).cost
        }
      })
      if(totalCost > donator.translateAmount(userPatreon, userDatabase)) {
        // Problem detected
        if(userDatabase.donator.transition) {
          // Already detected, check state and cancel perks if too long ago
          if(main.client.users.has(userDatabase.id) && !userDatabase.donator.transition.informed) {
            // Not yet informed but possible to inform, inform now
            let userDiscord = main.client.users.get(userDatabase.id)
            let options = {
              embed: {
                color: colors.red,
                title: `${emojis.xmark} **Problem detected**`,
                description: 'Hey there, we recently detected a problem with your Patreon pledge. it looks like your balance is not enough to cover the costs for all activated servers. ' +
                    'Please fix this issue asap. You can increase your pledge or disable/change servers. If you want to see all activated servers, ' +
                    `you can use the command \`${config.settings.prefix}premium list\` to do so. Please note, the commands need to be executed on a server and not via DMs.\n` +
                    'If you think this is an error, please contact our **[support](https://discord.gg/eBFu8HF)**.'
              }
            }
            userDiscord.send('', options).catch(() => {})
            userDatabase.donator.transition.informed = true
            userDatabase.save()
          }
          if(!userDatabase.donator.transition.detected) userDatabase.donator.transition.detected = Date.now()

          // TEST ONLY // if((userDatabase.donator.transition.detected.valueOf() + 1000*60*5) <= (Date.now().valueOf())) { // 5 minutes // TEST ONLY
          if((userDatabase.donator.transition.detected.valueOf() + 1000*60*60*24*3) <= (Date.now().valueOf())) { // 3 days
            // Too long ago, no change, premium cancelling
            console.log(`User ${userDatabase.id} didn't pay for too long and now gets his premium deactivated.`)
            let userDiscord = await main.client.fetchUser(userDatabase.id)
            let options = {
              embed: {
                color: colors.red,
                title: `${emojis.xmark} **Premium deactivated**`,
                description: 'Hey there, this is a notice that you premium has been deactivated. This happened because we weren\'t able to check your pledge for 3 days.\n' +
                    'All your premium activations have been disabled. If you think this is an error, please contact our **[support](https://discord.gg/eBFu8HF)**.'
              }
            }
            if(userDiscord) userDiscord.send('', options).catch(() => {})
            console.log(`Patreon checks premium disabled message sent to ${userDatabase.id}`)
            guildsDatabase.forEach(guildDatabase => {
              guildDatabase.donators = guildDatabase.donators.slice()
              guildDatabase.donators = guildDatabase.donators.filter(donator => donator.id !== userDatabase.id)
              guildDatabase.save()
            })
            userDatabase.donator.transition = undefined
            userDatabase.donator.assigned = []
            userDatabase.save()
          }
        } else {
          // Not yet informed. Inform user and start transition
          let userDiscord = await main.client.fetchUser(userDatabase.id)
          let options = {
            embed: {
              color: colors.red,
              title: `${emojis.xmark} **Problem detected**`,
              description: 'Hey there, we recently detected a problem with your Patreon pledge. it looks like your balance is not enough to cover the costs for all activated servers. ' +
                  'Please fix this issue asap. You can increase your pledge or disable/change servers. If you want to see all activated servers, ' +
                  `you can use the command \`${config.settings.prefix}premium list\` to do so. Please note, the commands need to be executed on a server and not via DMs.\n` +
                  'If you think this is an error, please contact our **[support](https://discord.gg/eBFu8HF)**.'
            }
          }
          if(userDiscord) userDiscord.send('', options).catch(() => {})
          console.log(`Patreon checks problem detected message sent to ${userDatabase.id}`)
          userDatabase.donator.transition.amount = donator.translateAmount(userPatreon, userDatabase)
          userDatabase.donator.transition.detected = Date.now()
          userDatabase.donator.transition.informed = true
          userDatabase.save()
          console.log(`User ${userDatabase.id} changed his pledge. Starting transition process.`)
        }
      } else {
        let userDiscord = await main.client.fetchUser(userDatabase.id)
        if(userDatabase.donator.transition && userDatabase.donator.transition.informed) {
          let options = {
            embed: {
              color: colors.green,
              title: `${emojis.check} **Problem fixed**`,
              description: 'Hey there, we recently detected a problem with your Patreon pledge. However, it looks like the problem has been resolved and we removed the entry from our database.\n' +
                  'Thank you for your support!'
            }
          }
          if(userDiscord) userDiscord.send('', options).catch(() => {})
          console.log(`Patreon checks problem resolved message sent to ${userDatabase.id}`)
        }
        userDatabase.donator.transition = undefined
        userDatabase.save()
      }
    })
  } catch (error) {
    console.log('Error while checking patreon!')
    console.log(error)
  }

  setTimeout(() => module.exports.checkPatreonLoop(), 1000*60*main.client.shard.count)
}

async function refreshPatreonRoles(guild, userDatabase, userPatreon) {
  if(!guild.members.has(userDatabase.id)) return
  let member = guild.members.get(userDatabase.id)

  // Roles
  let premiumRoles = config.discord.premiumRoles

  let premiumRole = null
  premiumRoles.forEach(thisPremiumRole => {
    if(thisPremiumRole.cost <= userPatreon.cents) {
      if(!premiumRole) premiumRole = thisPremiumRole
      else if(premiumRole.cost < thisPremiumRole.cost) premiumRole = thisPremiumRole
    }
  })

  premiumRoles.forEach(thisPremiumRole => {
    if(premiumRole && thisPremiumRole.id === premiumRole.id) member.addRole(thisPremiumRole.id).catch(() => {})
    else member.removeRole(thisPremiumRole.id).catch(() => {})
  })
}

async function refreshNitroBoosters(guild) {
  // Nitro Boosters
  let boosters = [];

  let role = guild.roles.get(config.discord.boosterRole)
  role.members.forEach(member => boosters.push(member.user.id))
  role.members.forEach(async member => {
    let userDatabase = await common.getUserDatabase(member.user.id)
    if(!userDatabase.nitroBooster) {
      userDatabase.nitroBooster = true
      userDatabase.save()
      let options = {
        embed: {
          color: colors.green,
          title: `${emojis.check} **Boost power enabled**`,
          description: 'Hey there, we just saw you boosted our server Open Advertisements. That\'s awesome, thank you so much! ' +
              `As a thank you, you get a free bonus of $5.00 that allows you to use the premium version of this bot.\n` +
              `To start using it, please check out the command \`${config.settings.prefix}premium\`. It will tell you how you can use your bonus.`
        }
      }
      member.user.send('', options).catch(() => {})
    }
  })

  let boostersDatabase = await User.find({ nitroBooster: true })
  boostersDatabase.forEach(async boosterDatabase => {
    if(!boosters.includes(boosterDatabase.id)) {
      let boosterDiscord = main.client.fetchUser(boosterDatabase.id)
      boosterDatabase.nitroBooster = false
      boosterDatabase.save()
      if(boosterDiscord) {
        let options = {
          embed: {
            color: colors.red,
            title: `${emojis.xmark} **Boost power disabled**`,
            description: 'Hey there, we just saw you removed your boost from Open Advertisements. ' +
                `Because of that, you lost your free $5.00 bonus. That's sad!\n` +
                `You may receive further messages from this bot in case your new balance isn't enough to cover the costs for all activated servers.`
          }
        }
        boosterDiscord.send('', options).catch(() => {})
      }
    }
  })

  // Roles
  let premiumRoles = config.discord.premiumRoles

  premiumRoles.forEach(thisPremiumRole => {
    if(guild.roles.has(thisPremiumRole.id)) {
      let role = guild.roles.get(thisPremiumRole.id)
      role.members.forEach(async member => {
        let user = member.user
        let userDatabase = await common.getUserDatabase(user.id)

        let userPatreon = await fetch(`http://localhost:3000/api/patreon/user/${userDatabase.id}`, {
          headers: {
            authorization: `Bearer ${config.server.token}`
          }
        }).then(res => res.json())

        refreshPatreonRoles(guild, userDatabase, userPatreon)
      })
    }
  })
}
