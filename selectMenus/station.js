const { Models, stream, log, config } = require("../server")
const { EmbedBuilder } = require("discord.js")
const youtubeSearch = require('yt-search')

module.exports = {
    name: "stationsMenu",
    run: async (client, interaction) => {
        if (!interaction.values[0]) return;
        let userChannel = interaction.member.voice.channel
        if (!userChannel) return await interaction.reply({ content: "Bir ses kanalında olmalısın.", ephemeral: true })
        let serverModel = await Models.connections.findOne({ guildId: interaction.guildId })

        await stream(interaction.guildId)
        let url = `https://www.youtube.com/watch?v=${interaction.values[0]}`
        let searchData = await youtubeSearch(interaction.values[0])
        let live = searchData.live[0]
        const embed = new EmbedBuilder().setColor(0xff00ff)
            .setTitle(live.title).setURL(live.url)
            .setAuthor({ name: live.author.name, url: live.author.url })
            .setDescription(live.description)
            .setThumbnail(live.thumbnail)
            .setFooter({ text: config.embedFooter })


        serverModel.voiceChannelId = userChannel.id
        serverModel.radioURL = url
        serverModel.save()

        await Models.connections.updateOne({ guildId: interaction.guildId }, {
            $push: {
                usedCommands: {
                    code: `#${serverModel?.usedCommands?.length + 1}`,
                    args: url,
                    userId: interaction.member.user.id,
                    name: "radyo"
                }
            }
        }, { upsert: true }).catch(e => log(String(e), true))
        
        interaction.editReply({ content: "Bağlanıyor...", embeds: [], components: [] })
        await stream(interaction.guildId)
        return setTimeout(() => interaction.editReply({ content: null, embeds: [embed], components: [] }), 3000)
    }
}
