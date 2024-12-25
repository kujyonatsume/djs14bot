import { Like } from "typeorm"
import { db } from "../../db";
import { twitterApi, TwitterList } from "../../twitter";
import { Group, Module, Option, SubGroup } from "../decorator";
import { AutocompleteInteraction, ChannelType, GuildBasedChannel, hyperlink, inlineCode, Role, TextChannel, User } from 'discord.js';
import config from "../../config"

@Group({ local: "推文", permission: "Administrator" })
export class Twitter extends Module {

    static List: TwitterList
    async init() {
        Twitter.List = (await twitterApi.getLists()).find(x => x.name == "twitterNotify")
            ?? await twitterApi.ListCreate("twitterNotify", "Powered by TS", true)
        Twitter.List.members = await Twitter.List.getMamber()

        for (const u of await db.TwitterUser.find({ select: ["id"] })) {
            if (Twitter.List.members.find(x => x.id == u.id)) continue
            await Twitter.List.addMamber(u.id)
            await Promise.delay(1000)
        }

        setTimeout(async () => await this.Timer(), 1);
    }
    async Timer() {

        console.log(`[Twitter Notify]: ${Twitter.List.members.map(x => x.screen_name).join(", ")}`);

        while (true) {
            try {
                await Promise.delay(config.ms)
                const dbusers = await db.TwitterUser.find()
                const tweets = (await Twitter.List.getTweets()).sort((a, b) => Number(a.id) - Number(b.id))
                for (const user of dbusers) {
                    if (user.notifys.length == 0) {
                        await Twitter.List.removeMamber((await user.remove()).id)
                        console.log(`已將 ${user.screen_name} 移除\n`)
                        continue
                    }

                    const userTweets = tweets.filter(x => x.author.id == user.id && Number(x.id) > Number(user.last_tweet))

                    if (userTweets.length == 0) continue

                    console.log(new Date().toLocaleString());
                    console.log(`${user.name}(${user.screen_name}) 有 ${userTweets.length} 則新推文`)
                    console.log(userTweets.map(x => `https://x.com/${x.author.screen_name}/status/${x.id}`).join("\n"))
                    console.log(`已將 ${user.screen_name} 的推文發到 ${user.notifys.length} 個頻道\n`)

                    for (const notify of user.notifys) {

                        const channel = this.client.channels.cache.get(notify.channelId) as TextChannel
                        if (!channel?.send) {
                            await notify.remove()
                            continue
                        }

                        for (const tweet of userTweets) {

                            if (!notify.type.includes(tweet?.type)) continue

                            const embeds = [this.Embed.setColor("Blue")
                                .setAuthor(tweet.author.Embed)
                                .setTitle(`${tweet.author.name}${tweet.type}了一篇推文`)
                                .setURL(`https://x.com/${tweet.author.screen_name}/status/${tweet.id}`)
                                .setDescription(tweet.text)
                                .setTimestamp(tweet.created_at)]

                            if (tweet.urls?.length) {
                                let url = tweet.urls.join("\n")
                                if (url.length > 0)
                                    embeds[0].addFields({ name: "連結", value: tweet.urls.join("\n") })
                            }
                            try {
                                if (!tweet.medias)
                                    await channel.send({ content: notify.Text, embeds })

                                else if (tweet.medias[0].type == "photo") {
                                    embeds[0].setImage(tweet.medias[0].best_url)
                                    for (const media of tweet.medias.slice(1)) {
                                        embeds.push(this.Embed.setColor("Blue").setImage(media.best_url))
                                    }
                                    await channel.send({ content: notify.Text, embeds })
                                }
                                else {
                                    await channel.send({ content: notify.Text, embeds })
                                    await channel.send({ content: tweet.medias.map(media => hyperlink(media.type, media.best_url)).join("\n") })
                                }
                            } catch (e) {
                                console.log(new Date().toLocaleString());
                                console.log(e)
                            }
                        }
                    }

                    var last = userTweets.pop();
                    user.last_tweet = last.id
                    user.screen_name = last.author.screen_name
                    await user.save()
                }
            }
            catch (e) {
                console.log(new Date().toLocaleString());
                console.log(e)
                console.log("\n");
            }
        }
    }

    static notify = SubGroup({ name: "notify", local: "通知" })

    static async FindOrCreateUser(screen_name: string) {
        let dbUser = await db.TwitterUser.findUser(screen_name)
        let exists = Boolean(dbUser)
        if (!dbUser) {
            const apiUser = await twitterApi.getUserByScreenName(screen_name)
            await this.List.addMamber(apiUser.id)
            dbUser = await db.TwitterUser.findId(apiUser.id)
            if (!dbUser) {
                dbUser = db.TwitterUser.create(apiUser)
                dbUser.last_tweet = (await twitterApi.getUserTweets(dbUser.id, true)).sort((a, b) => Number(b.id) - Number(a.id))[0].id
                dbUser = await dbUser.save()
            }
            else {
                await db.TwitterUser.update({ id: apiUser.id }, apiUser)
                dbUser = await db.TwitterUser.findId(apiUser.id)
            }
        }
        return { dbUser, exists }
    }

    static async guildNotify(mod: Twitter, i: AutocompleteInteraction, current: string | number) {
        return Promise.all((await db.TwitterNotify.findBy({ guildId: i.guildId })).map(async x => {
            let user = await x.target; return { name: user.screen_name, value: user.screen_name }
        }))
    }

    static async allGuild(mod: Twitter, i: AutocompleteInteraction, current: string | number) {
        return i.client.guilds.cache.map(x => { return { name: x.name, value: x.id } })
    }

    static async allNotify(mod: Twitter, i: AutocompleteInteraction, current: string) {
        var l = await Promise.all((await Promise.all((await db.TwitterNotify.find())
            .filter(async x => (await x.target).screen_name.startsWith(current)))).map(async x => {
                let user = await x.target;
                return { name: user.screen_name, value: user.screen_name }
            }))
        l.length = 25
        return l
    }

    static async allName(mod: Twitter, i: AutocompleteInteraction, current: string) {
        var users = (await db.TwitterUser.find()).filter(x => x.screen_name.startsWith(current.replace(/(.*?)\/\/(.*?)\/|@/, "").split("?")[0]))
            .map(x => ({ name: x.screen_name, value: x.screen_name }))
        if (users.length <= 5) return users

        var userset = new Set<{ name: string, value: string }>()
        while (userset.size < 5) {
            userset.add(users[Math.randomInt(users.length - 1)])
        }
        return Array.from(userset)
    }

    static YesOrNo = [{ name: "Yes", value: 1, name_localizations: { "zh-TW": "是" } }, { name: "No", value: 0, name_localizations: { "zh-TW": "否" } }]

    @Twitter.notify({ local: "新增爬蟲", name: "create", desc: "若無符合的帳號請自行輸入 通知身分組請直接加入通知訊息中" })
    async cteateNotify(@Option({ local: "帳號", exec: Twitter.allName }) screen_name: string,
        @Option({ local: "通知頻道", channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel: TextChannel,
        @Option({ local: "通知訊息", required: false }) text?: string) {
        screen_name = screen_name.replace(/(.*?)\/\/(.*?)\/|@/, "").split("?")[0];
        const { dbUser, exists } = await Twitter.FindOrCreateUser(screen_name)
        if (await db.TwitterNotify.existsBy({ guildId: this.i.guildId, targetId: dbUser.id }))
            return await this.SuccessEmbed(`伺服器已存在此爬蟲, 如果要更新請使用 ${inlineCode("/twitter notify update")}`, true)

        let notify = db.TwitterNotify.create({ guildId: this.i.guildId, targetId: dbUser.id, channelId: channel.id })
        notify.text = text ?? ""
        notify.target = Promise.resolve(dbUser)
        await notify.save()

        return await this.SuccessEmbed(`已新增爬蟲 ${inlineCode(screen_name)}`, true)
    }

    @Twitter.notify({ local: "更新爬蟲", name: "update" })
    async updateNotify(@Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string,
        @Option({ local: "移動至頻道", required: false, channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel?: TextChannel,
        @Option({ local: "新的通知訊息", required: false }) text?: string) {
        const { dbUser } = await Twitter.FindOrCreateUser(screen_name)
        let notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: dbUser.id })
        if (notify) {
            if (channel?.id) notify.channelId = channel.id
            if (text) notify.text = text
            await notify.save()
            return await this.SuccessEmbed(eb => eb.setDescription(`已更新爬蟲 ${inlineCode(screen_name)}`)
                .addFields({ name: "通知頻道", value: `<#${notify.channelId}>` }, { name: "通知訊息", value: notify.Text ?? "未設定" }), true)
        }
        return await this.SuccessEmbed(`伺服器不存在此爬蟲, 如果要新增請使用 ${inlineCode("/twitter notify create")}`, true)
    }

    @Twitter.notify({ local: "篩選推文", name: "filier", desc: "篩選推文狀態 | 預設值: 發佈 引用" })
    async filierNotifyStatus(@Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string,
        @Option({ local: "發佈", required: false }) post?: boolean,
        @Option({ local: "轉推", required: false }) retweet?: boolean,
        @Option({ local: "引用", required: false }) qoute?: boolean,
        @Option({ local: "回復", required: false }) reply?: boolean
    ) {
        const { dbUser } = await Twitter.FindOrCreateUser(screen_name)
        let notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: dbUser.id })
        let data = new Set(JSON.parse(notify.type) as string[])
        console.log(data);
        update("發佈", post); update("轉推", retweet); update("引用", qoute); update("回復", reply)
        notify.type = JSON.stringify([...data])
        await notify.save()
        return await this.SuccessEmbed(`${screen_name} 將會搜尋 ${[...data].map(inlineCode).join(" ")} 貼文`, true)

        function update(type: string, value?: boolean) {
            console.log(type, value);
            if (typeof value !== "boolean") return;
            if (value) data.add(type)
            else data.delete(type)
        }
    }

    @Twitter.notify({ local: "推文篩選列表", name: "filierlist", desc: "顯示推文篩選列表" })
    async NotifyStatus() {
        let users = "", status = ""
        for (const notify of await db.TwitterNotify.findBy({ guildId: this.i.guildId })) {
            users += `${inlineCode((await notify.target).screen_name)}\n`
            status += `${(JSON.parse(notify.type) as string[]).map(inlineCode).join(" ")}\n`
        }
        if (users == "") return await this.ErrorEmbed(`伺服器未加入爬蟲`)
        if (status == "") status += "沒有選擇的狀態"
        return await this.SuccessEmbed(x => x.setTitle("伺服器推文通知列表")
            .setFields({ name: "使用者", value: users, inline: true }, { name: "已啟用", value: status, inline: true }), true)
    }

    @Twitter.notify({ local: "移除爬蟲", name: "remove" })
    async removeNotify(@Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string) {
        let dbUser = await db.TwitterUser.findUser(screen_name)
        if (dbUser) {
            let notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: dbUser.id })
            if (notify) {
                notify.remove()
                return await this.SuccessEmbed(`已移除爬蟲 ${inlineCode(screen_name)}`, true)
            }
        }
        return await this.SuccessEmbed(`伺服器不存在此爬蟲`, true)
    }

    @Twitter.notify({ local: "爬蟲清單", name: "list" })
    async listNotify() {
        let users = "", channels = "", notifys = ""
        for (const notify of await db.TwitterNotify.findBy({ guildId: this.i.guildId })) {
            let target = await notify.target
            users += `${inlineCode(target.screen_name)}\n`
            channels += `<#${notify.channelId}>\n`
            let msg = ""
            if (notify.Text) msg += ` ${inlineCode(notify.Text)}`
            notifys += `${msg == "" ? "無" : msg}\n`
        }
        if (users == "") await this.SuccessEmbed(`伺服器未加入爬蟲`)
        return await this.SuccessEmbed({
            title: "伺服器推文通知列表",
            fields: [{ name: "使用者", value: users, inline: true },
            { name: "通知頻道", value: channels, inline: true },
            { name: "通知訊息", value: notifys, inline: true },
            ]
        }, true)
    }
}