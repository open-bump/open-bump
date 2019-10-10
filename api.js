const express = require('express')
const router = express.Router()
const config = require('./config')
const patreon = require('./patreon')

module.exports.router = router

router.get('/', (req, res) => {
  res.send('hi')
})

router.get('/patreon/user/:user', async (req, res) => {
  if(req.query.token && req.query.token === config.server.token) {
    if(req.query.fetch) await patreon.refresh()
    let userPatreon = await patreon.getPatreonUser(req.params.user)
    if(userPatreon) {
      //userPatreon.cents = 700 // <-- to test stuff
      res.json(userPatreon)
    } else {
      res.status(404)
      res.json({ status: 404, message: 'That user could not be found' })
    }
  } else {
    res.status(403)
    res.json({ status: 403, message: 'Forbidden' })
  }
})
