const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')

const GuildSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  donator: {
    tier: {
      type: String,
      required: false
    },
    amount: {
      type: Number,
      required: false
    },
    patreon: {
      email: {
        type: String,
        required: false
      }
    },
    history: {
      type: Array,
      required: true,
      default: []
    },
    lastChange: {
      type: Date,
      required: false
    },
    assigned: {
      type: Array,
      required: true,
      default: []
    }
  }
})

GuildSchema.plugin(findOrCreate)

const Guild = mongoose.model('Guild', GuildSchema)

module.exports = Guild
