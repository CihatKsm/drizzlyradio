const { client, currentTime, Models, log } = require("../server")
const { EmbedBuilder, ApplicationCommandOptionType, PermissionsBitField, InteractionType } = require("discord.js")

client.on("interactionCreate", async (interaction) => {
    const Flags = PermissionsBitField.Flags
    if (interaction.type === InteractionType.ApplicationCommand) {
        const cmd = client.slashCommands.get(interaction.commandName)
        if (!cmd) return interaction.reply({ content: "😕 Komuta erişim sağlanamadı.", ephemeral: true })
        const args = []
        for (let option of interaction.options.data) {
            if (option.type === ApplicationCommandOptionType.Subcommand) {
                if (option.name) args.push(option.name)
                option.options?.forEach((x) => {
                    if (x.value) args.push(x.value)
                })
            } else if (option.value) args.push(option.value)
        }

        interaction.member = interaction.guild.members.cache.get(interaction.user.id)
        let memberPerms = interaction.member.permissions
        let permissionCheck = memberPerms.has(
            cmd.authorityLevel == "can-ban" ? Flags.BAN_MEMBERS : cmd.authorityLevel == "can-kick" ? Flags.KICK_MEMBERS :
                cmd.authorityLevel == "message-manager" ? Flags.MANAGE_MESSAGES : cmd.authorityLevel == "administrator" ? Flags.ADMINISTRATOR : Flags.SEND_MESSAGES
        )

        if (cmd.authorityLevel == "dj") {
            let serverModel = await Models.connections.findOne({ guildId: interaction.guildId })
            if (serverModel && serverModel.djStatus == "true") {
                let isDJ = serverModel.diskJokeys.includes(interaction.user.id)
                if (!isDJ )
                    return interaction.reply({ content: "Sunucunun yöneticisi veya DJ'i değilsin." })
            }
        }

        if (!permissionCheck || cmd.authorityLevel == "developers" && !config.developers.includes(interaction.member.user.id))
            return interaction.reply({ content: "😕 Komutu kullanabilmek için yeterli yetkiye sahip değilsiniz.", ephemeral: true })

        cmd.run(client, interaction, args).catch(async (error) => {
            log(String(error), true)
            return interaction.reply({
                content: "😕 Yazdığınız komutta bir hata meydana geldi. \n" +
                    "Lütfen bunu \`help@drizzlydeveloper.xyz\` mail adresine yada \`/geri_bildirim\` komutu ile bildiriniz. \n" +
                    `\`\`\`Hata oluşma zamanı: ${await currentTime("DD MMMM YYYY HH.mm.ss")} \n` +
                    `Hatanın genel konumu: ${interaction.commandName} \n\n` +
                    `Hata:\n${await String(error)}\`\`\``,
                ephemeral: true
            }).catch((e) => log(String(e), true))
        })
    }

    if (interaction.isButton()) { }
    if (interaction.isStringSelectMenu()) {
        const cmd = client.selectMenus.get(interaction.customId)
        if (!cmd) return interaction.reply({ content: "😕 Seçim yaptığınız menü sistemde bulunmamaktadır.", ephemeral: true })
        interaction.member = interaction.guild.members.cache.get(interaction.user.id)
        await interaction.deferUpdate()
        try { cmd.run(client, interaction) }
        catch (error) { console.log(String(error)) }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        const feedback_description = interaction.fields.getTextInputValue('feedback_description')
        if (feedback_description) {
            let check = swearBlocker(feedback_description)
            if (check == true) return;

            await interaction.reply({ content: 'Teşekkürler, geri bildiriminiz başarıyla gönderildi!', ephemeral: true });
            let channel = client.guilds.cache.get("939976041932398692").channels.cache.get("986941238232104990")
            let embed = new EmbedBuilder().setColor(0xff00ff).setFooter({ text: config.embedFooter })
                .setAuthor({ name: interaction.member.user.username, iconURL: interaction.member.user.displayAvatarURL() })
                .setDescription(
                    `> Gönderen: ${interaction.member} \n` + 
                    `> Hakkında detaylı bilgi [tıkla →](http://drizzlydeveloper.xyz/api/discord/users/${interaction.member.id}) \n` +
                    `\`\`\`${feedback_description}\`\`\``
                )
                .setTimestamp()

            channel.send({ embeds: [embed] }).catch((err) => console.log(String(err)))
        }
    }
})
