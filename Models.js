const mongoose = require('mongoose')

module.exports.connections = mongoose.model("connections", mongoose.Schema({
    guildId: { type: String, required: true },
    voiceChannelId: { type: String, required: true },
    radioURL: { type: String, required: true },
    djStatus: { type: String, required: true, default: "false" },
    diskJokeys: { type: Array, default: [] },
    usedCommands: { type: Array, default: [] }
}))