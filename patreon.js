const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')
const patreon = require('patreon')
const patreonAPI = patreon.patreon
const common = require('./utils/common')
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'))
const CLIENT_ID = config.patreon.clientId
const CLIENT_SECRET = config.patreon.clientSecret
const REFRESH_TOKEN = config.patreon.refreshToken
const BASE_URL = ''
let accessToken = null
let client = null

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
