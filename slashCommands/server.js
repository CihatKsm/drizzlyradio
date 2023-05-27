const { Models } = require("../server")
const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js")

module.exports = {
    type: ApplicationCommandType.ChatInput,
    authorityLevel: "administrator",
    name: "sunucu",
    description: "Sunuda radyo botunu kimlerin kontrol edebileceğini seçebilirsiniz.",
    options: [
        {
            name: "dj",
            description: "Belirttiğiniz kullanıcıya DJ'lik verilecektir.",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Sunucuda DJ'lik yapılsın", value: "on" },
                { name: "Sunucuda DJ'lik yapılmasın", value: "off" },
            ]
        }
    ],
    run: async (client, interaction, args) => {
        let dj = interaction.options.getString("dj")
        let data = await Models.connections.findOne({ guildId: interaction.guildId })
        
        if (dj == "on") {
            let content = "Sunucuda zaten DJ'lik özelliği açık."
            if (data?.djStatus == "true") return await interaction.reply({ content, ephemeral: true })
            data.djStatus = "true"
            data.save()
            return await interaction.reply({ 
                content: "Bu özellik artık açıktır. \nArtık sadece sunucu yöneticileri ve DJler botu kullanabilecekler", 
                ephemeral: "true"
            })
        }

        if (dj == "off") {
            let content = "Sunucuda zaten DJ'lik özelliği kapalı."
            if (data?.djStatus == "false") return await interaction.reply({ content, ephemeral: true })
            data.djStatus = "false"
            data.save()
            return await interaction.reply({ content: "Bu özellik artık kapalıdır.", ephemeral: true })
        }
    }
}
