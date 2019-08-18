const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');

const GuildSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  bump: {
    description: {
      type: String,
      required: false
    },
    banner: {
      type: String,
      required: false
    },
    color: {
      type: Number,
      required: false
    }
  },
  feed: {
    type: String,
    required: false
  },
  lastBump: {
    user: {
      type: String,
      required: false
    },
    time: {
      type: Date,
      required: false
    }
  },
  features: {
    type: Array,
    required: true,
    default: []
  },
  donator: {
    type: String,
    required: false
  }
});
