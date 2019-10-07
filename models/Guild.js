const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')

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
      required: true,
      default: -1
    },
    invite: {
      type: String,
      required: false
    }
  },
  settings: {
    prefix: {
      type: String,
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
  bumps: {
    type: Number,
    required: true,
    default: 0
  },
  features: {
    type: Array,
    required: true,
    default: []
  },
  donators: {
    type: Array,
    required: false
  }
})

GuildSchema.plugin(findOrCreate)

const Guild = mongoose.model('Guild', GuildSchema)

module.exports = Guild
