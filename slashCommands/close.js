const { ApplicationCommandType } = require("discord.js")
const { Models, stream, log } = require("../server")

module.exports = {
    type: ApplicationCommandType.ChatInput,
    authorityLevel: "dj",
    name: "kapat",
    description: "Sesli kanaldaki radyoyu kapatmanızı sağlar.",
    run: async (client, interaction, args) => {
        let serverModel = await Models.connections.findOne({ guildId: interaction.guildId })

        if (!serverModel.radioURL)
            return await interaction.reply({ content: "Radyo şuan kapalı.", ephemeral: true })

        serverModel.voiceChannelId = null
        serverModel.radioURL = null
        serverModel.save()

        await Models.connections.updateOne({ guildId: interaction.guildId }, {
            $push: {
                usedCommands: {
                    code: `#${serverModel?.usedCommands?.length + 1}`,
                    args: null,
                    userId: member.user.id,
                    name: "kapat"
                }
            }
        }, { upsert: true }).catch(e => log(String(e), true))

        await stream(interaction.guildId)
        return await interaction.reply({ content: "Tamamdır, radyoyu kapattım.", ephemeral: true })
    }
}
