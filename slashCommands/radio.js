const { EmbedBuilder, SelectMenuBuilder, ActionRowBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js")
const youtubeSearch = require('yt-search')
const { config } = require("../server")

module.exports = {
    type: ApplicationCommandType.ChatInput,
    authorityLevel: "dj",
    name: "radyo",
    description: "Sesli kanalda radyo istasyonuna bağlanmanızı sağlar.",
    options: [
        {
            name: "istasyon-adı",
            description: "Belirttiğiniz istasyona bağlanılacaktır.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction, args) => {
        let stationOption = interaction.options.getString("istasyon-adı")
        const searchData = await youtubeSearch(stationOption)
        let stationsArray = []
        
        if (!searchData.live[0]) return await interaction.reply({ content: "Hiçbir radyo istasyonu bulunamadı", ephemeral: true })
        
        searchData.live.slice(0,8).map(m => stationsArray.push({
            "label": m.title,
            "value": m.videoId
        }))

        let stationMenu = new SelectMenuBuilder()
            .setCustomId('stationsMenu')
            .setPlaceholder('Bağlanmak istediğiniz istasyonu seçiniz.')
            .addOptions(stationsArray)
        
        let ActionRow = new ActionRowBuilder().addComponents(stationMenu)

        let embed = new EmbedBuilder().setColor(0xff00ff).setFooter({ text: config.embedFooter })
            .setDescription(
                `Arama sonucu aşağıdaki menüde listelenmiştir. \n` +
                `Bağlanmak istediğinizi radyo istasyonunu menüden seçiniz.`
            )

        return await interaction.reply({ embeds: [embed], components: [ActionRow], ephemeral: true })
    }
}
