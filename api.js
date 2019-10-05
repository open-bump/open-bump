const main = require('./bot'),
      express = require('express'),
      app = express(),
      port = 3000;

module.exports.run = async () => {
  // try {
  //   await app.listen(port);
  //   console.log(`Successfully started API Server on port ${port}!`);
  //   return true;
  // } catch (err) {
  //   console.log(`Error while starting API Server on port ${port}!`);
  //   return err;
  // }
};

app.get('/', (req, res) => {
  let response = {
    code: 404,
    message: 'Endpoint Not Found!'
  };
  res.status(404);
  res.json(response);
});
