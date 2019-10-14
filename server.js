const express = require('express')
const app = express()
const config = require('./config')
const port = config.server.port

module.exports.run = async () => {
  try {
    await app.listen(port)
    console.log(`Successfully started API Server on port ${port}!`)
    return true
  } catch (err) {
    console.log(`Error while starting API Server on port ${port}!`)
    return err
  }
}

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api', require('./api').router);

// Listeners
app.all('*', (req, res) => {
  res.status(404)
  res.send('404 Not Found')
})
