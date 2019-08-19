const main = require('./index'),
      express = require('express'),
      app = express(),
      port = 3000;

module.exports.run = () => {
  app.listen(port, () => {
    console.log('API webserver successfully started!');
  });
};

app.get('/', (req, res) => {
  let response = {
    code: 404,
    message: 'Endpoint Not Found!'
  };
  res.status(404);
  res.json(response);
});
