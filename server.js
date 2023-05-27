const DiscordPLayer = require("discord-player")
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const mongoose = require('mongoose')
const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ], partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember
    ]
});

const fs = require("fs")
const path = require("path")
const DayJs = require("dayjs")
const log = (i, err) => err ? console.error(i) : console.log(i)

require('dayjs/locale/tr')
require("dayjs").extend(require('dayjs/plugin/timezone'))
require("dayjs").extend(require('dayjs/plugin/utc'))
require("dayjs").locale('tr')

const currentTime = (format, date) => DayJs(date ? date : null).tz('Asia/Istanbul').format(format)
const Player = new DiscordPLayer.Player(client, { ytdlOptions: { quality: "highestaudio", highWaterMark: 1 << 25 } })
const config = fs.existsSync(path.join(__dirname, "../config.js")) ? require("../config") : process.env

client.slashCommands = new Collection()
client.selectMenus = new Collection()

const Models = require("./Models")
fs.readdir("./events/", (e, f) => e ? log(e, true) : f.forEach(ff => require(`./events/${ff}`)))

client.on("warn", e => log(e, true))
client.on("error", e => log(e, true))

mongoose.connect(config.mongoURL + "/drizzlyradio-test", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log(`✅ MongoDB: ${mongoose?.connections[0]?.name}`))
    .then(() => discordConnect())
    .catch(() => console.log("❎ MongoDB: Not Connection"))

function discordConnect() {
    if (!mongoose?.connections[0]?.name) return setTimeout(() => discordConnection(), 1500)
    client.login(config.token)
        .then(() => console.log(`✅ Connecting to ${client.user.tag}`))
        .then(async () => await commandsLoad())
        .catch((e) => console.log(`❎ Discord bot not connected! \n${String(e)}`))
}

module.exports = { client, log, config, currentTime, Models, stream }

async function commandsLoad() {
    const arrayOfSlashCommands = []
    const arrayOfSelectMenus = []
    const slashCommandFiles = fs.readdirSync('./slashCommands').filter(file => file.endsWith('.js'))
    const menuFiles = fs.readdirSync('./selectMenus').filter(file => file.endsWith('.js'))

    for (const file of slashCommandFiles) {
        const command = require(`./slashCommands/${file}`)
        client.slashCommands.set(command.name, command)
        arrayOfSlashCommands.push(command)
    }

    for (const file of menuFiles) {
        const command = require(`./selectMenus/${file}`)
        client.selectMenus.set(command.name, command)
        arrayOfSelectMenus.push(command)
    }

    await client.application.commands.set(arrayOfSlashCommands)
    //await client.application.commands.set([])
}

async function stream(guildId) {
    if (!guildId) {
        return client.guilds.cache.map(async (m) => {
            let serverModel = await Models.connections.findOne({ guildId: m.id })
            if (!serverModel) {
                await Models.connections.updateOne(
                    { guildId: m.id }, { voiceChannelId: null, radioURL: null },
                    { upsert: true }
                ).catch(err => console.log(String(error)))
            } else {
                let guildClient = client.guilds.cache.get(m.id)
                let channel = serverModel.voiceChannelId
                if (channel) {
                    let channelClient = guildClient?.channels.cache.get(channel)
                    let meChannelClient = guildClient?.me?.voice.channel
                    let queue = await Player.getQueue(guildClient, { metadata: meChannelClient })
                    if (queue) await queue.skip()
                    if (!meChannelClient || meChannelClient && meChannelClient.id !== serverModel.voiceChannelId)
                        await Player.deleteQueue(guildClient, { metadata: channelClient })
                    return run(serverModel, guildClient, channelClient, meChannelClient, queue)
                }
            }
        })
    }

    let guildData = await Models.connections.findOne({ guildId })
    let guildClient = client.guilds.cache.get(guildId)
    let channelClient = guildClient?.channels.cache.get(guildData?.voiceChannelId)
    let meChannelClient = guildClient?.me?.voice?.channel
    let queue = meChannelClient ? await Player.getQueue(guildClient, { metadata: meChannelClient }) : null

    if (!guildData || !guildClient) return;

    if (!channelClient && queue) await queue.skip()
    if (!channelClient) return;

    if (!meChannelClient || meChannelClient && meChannelClient.id !== guildData.voiceChannelId)
        await Player.deleteQueue(guildClient, { metadata: channelClient })

    if (guildData.voiceChannelId && guildData.radioURL)
        return run(guildData, guildClient, channelClient, meChannelClient, queue)
}


async function run(guildData, guildClient, channelClient, meChannelClient, queue) {
    try {
        let lastUse = guildData?.usedCommands?.filter(f => f.name == "radyo").reverse()[0]
        let liveCode = guildData?.radioURL.slice(32, 99)
        let getQueue = await Player.getQueue(guildClient, { metadata: channelClient })
        let getTracks = getQueue?.player?.getQueue(guildClient, { metadata: channelClient })?.previousTracks
        let radioPlaying = getQueue?.player?.getQueue(guildClient, { metadata: channelClient })?.playing

        if (meChannelClient?.id == guildData?.voiceChannelId && (getTracks && getTracks[0]?.url == guildData?.radioURL)) return;

        if (getTracks && getTracks[0]) {
            await Player.deleteQueue(guildClient, { metadata: channelClient })
            return run(guildData, guildClient, channelClient, meChannelClient, queue)
        }

        let searchObj = { requestedBy: lastUse.userId, searchEngine: DiscordPLayer.QueryType.AUTO }
        let searchResult = await Player.search(liveCode, searchObj)
        let RadioLive = searchResult.tracks.filter(f => f.duration == "0:00")

        if (radioPlaying !== true) {
            let Radio = await Player.createQueue(guildClient, { metadata: channelClient })
            await Radio.connect(channelClient)
            await Radio.addTrack(RadioLive[0])
            await Radio.play()
        }
    } catch (error) {
        console.log(String(error))
    }
} 