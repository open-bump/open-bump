// Imports
const Discord = require('discord.js');
const client = new Discord.Client();
const mongoose = require('mongoose');

// Config
const config = require('./config');

// Database
mongoose.connect(config.database.mongoURI, { useNewUrlParser: true })
    .then(() => {
      console.log('Database successfully connected!')
      client.login(config.discord.token);
    })
    .catch(err => { console.log('Error while connecting to database!'); console.log(err) });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
