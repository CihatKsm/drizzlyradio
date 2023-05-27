const { Models } = require("../server")
const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js")

module.exports = {
    type: ApplicationCommandType.ChatInput,
    authorityLevel: "administrator",
    name: "dj",
    description: "Sunuda radyo botunu kimlerin kontrol edebileceğini seçebilirsiniz.",
    required: false,
    options: [
        {
            name: "yetki",
            description: "Belirttiğiniz kullanıcıya DJ'lik verilecektir.",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "al",
                    description: "DJ'lik yetkisini kullanıcıdan kaldırabilirsiniz.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "kullanıcı",
                            description: "Bir kullanıcı seçiniz.",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "ver",
                    description: "DJ'lik yetkisini kullanıcıya verebilirssiniz.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "kullanıcı",
                            description: "Bir kullanıcı seçiniz.",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                }
            ]
        }
    ],
    run: async (client, interaction, args) => {
        let embed = new EmbedBuilder().setColor(0xff00ff).setFooter({ text: `drizzlydeveloper.xyz` })
        let dj = interaction.options.get("kullanıcı")
        let data = await Models.connections.findOne({ guildId: interaction.guildId })
        let dataDjs = data.diskJokeys

        if (interaction.options._subcommand == "al") {
            let content = "Kullanıcı bu yetkiye sahip değildir."
            let _embed = embed.setDescription(
                `**<@${dj.user.id}> kullanısı artık sunucunun DJ'i değildir.** \n\n**Sunucunun DJ'leri: **` +
                data.diskJokeys.filter(f => f !== dj.user.id).map(m => `<@${m}>`).join(", ")
            )

            if (!dataDjs.includes(dj.user.id)) return await interaction.reply({ content, ephemeral: true })
            data.diskJokeys = data.diskJokeys.filter(f => f !== dj.user.id)
            data.save()
            return await interaction.reply({ embeds: [_embed], ephemeral: true })
        }

        if (interaction.options._subcommand == "ver") {
            let content = "Kullanıcı bu yetkiye sahiptir."
            let _embed = embed.setDescription(
                `**<@${dj.user.id}> kullanısı artık sunucunun DJ'idir.** \n\n**Sunucunun DJ'leri: **\n` +
                data.diskJokeys.map(m => `<@${m}>`).join(", ") + `, <@${dj.user.id}>`
            )
            if (dataDjs.includes(dj.user.id)) return await interaction.reply({ content, ephemeral: true })
            data.diskJokeys.push(dj.user.id)
            data.save()
            return await interaction.reply({ embeds: [_embed], ephemeral: true })
        }
    }
}
