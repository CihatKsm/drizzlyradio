const { client, stream } = require("../server")

client.on('ready', async () => {
    await stream()
    let activityes = [
        { text: "/help", waitSecond: 8 },
        { text: "drizzlydeveloper.xyz", waitSecond: 5 }
    ]

    await setActivity(activityes, 0)

    async function setActivity(activityes, number) {
        if (!activityes[number]) return setActivity(activityes, 0)
        let text = activityes[number].text
            .replace('guildsSize', `${client.guilds.cache.size}`)
            .replace('username', `${client.user.username}`)

        client.user.setActivity(text)
        
        setTimeout(() => {
            setActivity(activityes, number + 1)
        }, Number(activityes[number].waitSecond * 1000))
    }
})
