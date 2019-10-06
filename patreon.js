const fetch = require('node-fetch');
const FormData = require('form-data');
const config = require('./config');
const CLIENT_ID = config.patreon.clientId;
const CLIENT_SECRET = config.patreon.clientSecret;
const REFRESH_TOKEN = config.patreon.refreshToken;
let accessToken = null;

module.exports.run = async () => {
  console.log('Starting patreon services');
  console.log(await fetchAccessToken());
}

async function fetchAccessToken(){
  // POST www.patreon.com/api/oauth2/token
  //   ?grant_type=refresh_token
  //   &refresh_token=<the user‘s refresh_token>
  //   &client_id=<your client id>
  //   &client_secret=<your client secret>
  const form = new FormData();
  form.append('grant_type', 'refresh_token');
  form.append('refresh_token', REFRESH_TOKEN);
  form.append('client_id', CLIENT_ID);
  form.append('client_secret', CLIENT_SECRET);

  let res = await fetch('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  }).then(res => res.json());
  console.log(res);
}
