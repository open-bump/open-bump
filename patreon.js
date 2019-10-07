const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')
var patreon = require('patreon')
var patreonAPI = patreon.patreon
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
    pledges: {
      index: null
    }
  }
}

module.exports.run = async () => {
  try {
    console.log('Starting patreon services...')
    await fetchAccessToken()
    console.log(`Refresh Token: ${refreshToken}`)
    console.log(`Access Token: ${accessToken}`)
    module.exports.fullScan()
  } catch(err) {
    console.log(err)
  }
}

module.exports.fullScan = async () => {
  console.log('Starting patreon full scan...')

  let res

  // current_user
  try {
    res = (await client('/current_user')).rawJson.data
    if(res) cache.user.index = res
    else throw new Error('Current user is invalid!');
  } catch (error) {
    console.log(error)
  }

  // campaign
  try {
    res = (await client('/current_user/campaigns')).rawJson.data
    res = res.filter(res => res.id === config.patreon.campaign)[0];
    if(res) cache.campaign.index = res;
    else throw new Error('Campaign is invalid!');
  } catch (error) {
    console.log(error)
  }

  // campaign pledges
  try {
    res = (await client(`/campaigns/${config.patreon.campaign}/pledges`)).rawJson.data
    if(res) cache.campaign.pledges.index = res
    else throw new Error('Campaign\'s pledges are invalid!');

    try {
      res.forEach(pledge => {
        console.log(pledge);
      });
    } catch (error) {
      //throw error;
    }
  } catch (error) {
    console.log(error)
  }

  console.log(cache);
  console.log(cache.campaign.pledges);
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

async function get(path) {
  return fetch(path).then(res => res.json())
}
