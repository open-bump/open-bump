const express = require('express'),
      app = express(),
      port = 3000

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

// Listeners
app.all('*', (req, res) => {
  let response = {
    code: 404,
    message: 'Endpoint Not Found!'
  }
  res.status(404)
  res.json(response)
})
