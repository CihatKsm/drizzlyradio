const { client, stream } = require("../server")

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.guild.channelId) await stream(newState.guild.id)
    if (newState.id == client.user.id && !newState.channelId) await stream(newState.guild.id)
})