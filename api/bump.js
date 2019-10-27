const environment = process.argv.length >= 3 ? process.argv[2] : 'production';
module.exports.environment = environment
const config = require(`../config.${environment}.json`)

const express = require('express')
const router = express.Router()
const patreon = require('../patreon')
const common = require('../utils/common')
const bump = require('../utils/bump')
const Application = require('../models/Application')
const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')

module.exports.router = router

const indexRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 75, // start blocking after 75 requests
  message: "You are being ratelimitted! Try again later."
});

const indexSpeedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 10, // allow 10 requests per 1 minute, then...
  delayMs: 500 // begin adding 500ms of delay per request above 100:
});

router.post('/', indexRateLimiter, indexSpeedLimiter, checkAccess, async (req, res) => {
  try {
    if(!req.application.scopes.includes('bump')) return blockScopeMissing(res, 'bump')

    if(!req.body.embed) return error(res, 400, 'Bad Request')
    let botDiscord = req.application.bot ? await common.sharding.fetchUserFromIndex(req.application.bot) : null

    if(typeof req.body.embed === 'string') req.body.embed = JSON.parse(req.body.embed)

    let embed = req.body.embed
    if(typeof embed !== 'object') {
      return error(res, 400, 'Invalid parameter `embed`')
    }
    embed.footer = {
      text: `Sent by the ${botDiscord && botDiscord.tag ? `${botDiscord.tag} (${req.application.tag})` : req.application.tag} application.`,
      icon_url: botDiscord && botDiscord.displayAvatarURL ? botDiscord.displayAvatarURL : undefined
    }
    let options = {
      embed: embed
    }
    let amount = 0

    amount = await bump.bumpToAllShards(options, true)
    res.json({
      success: true,
      amount: amount
    })
  } catch(err) {
    res.status(500)
    res.json({
      status: 500,
      message: 'Internal Server Error',
      error: err
    })
  }
})

async function blockScopeMissing(res, scope) {
  res.status(403)
  res.json({ stats: 403, message: `Scope${scope.join && scope.length >= 2 ? 's' : ''} \`${scope.join ? scope.join(' ') : scope}\` missing` })
}

async function checkAccess(req, res, next) {
  const regex = /^Bearer ([0-9a-f]{0,})$/gm;
  let m;

  let headers = req.headers
  if(headers['authorization']) {
    let authorization = headers['authorization']

    let token = null

    while ((m = regex.exec(authorization)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++
      }

      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        if(groupIndex === 1) token = match
      })
    }

    token = common.toObjectId(token)

    if(token) {
      let application = await Application.findOne({ token: token })
      if(application) {
        req.application = application
        return next()
      }
    }
  }

  res.status(403)
  res.json({ status: 403, message: 'Authorization failed' })
}

function error(res, code, message) {
  let json = {
    status: code,
    message: message
  }
  res.status(code)
  res.json(json)
}
