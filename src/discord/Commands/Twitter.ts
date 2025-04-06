import { db } from "../../db";
import { twitterApi, TwitterList } from "../../twitter";
import { Command, Group, Module, Option, SubGroup } from "../decorator";
import { AutocompleteInteraction, ChannelType, hyperlink, inlineCode, TextChannel } from 'discord.js';
import config from "../../config"
import { bold } from "colors";

@Group({ local: "推文", permission: "Administrator" })
export class Twitter extends Module {

    static List: TwitterList
    async init() {
        Twitter.List = (await twitterApi.getLists()).find(x => x.name == "twitterNotify")
            ?? await twitterApi.ListCreate("twitterNotify", "Powered by TS", true)
        Twitter.List.members = await Twitter.List.getMember()

        for (const u of await db.TwitterUser.find({ select: ["id"], where:{ enabled: true } })) {
            if (Twitter.List.members.find(x => x.id == u.id)) continue
            await Twitter.List.addMember(u.id)
            await Promise.delay(50)
        }
        console.log(`[Twitter Notify]: ${Twitter.List.members.map(x => x.screen_name).join(", ")}`);
        setInterval(async () => await this.Timer(), config.ms)
    }

    async Timer() {
        try {
            const dbusers = await db.TwitterUser.find({ where:{ enabled: true } })
            const tweets = (await Twitter.List.getTweets()).sort((a, b) => Number(a.id) - Number(b.id))
            for (const user of dbusers) {
                if (user.notifys.length == 0) {
                    await Twitter.List.removeMember((await user.remove()).id)
                    console.log(`已將 ${user.screen_name} 移除\n`)
                    continue
                }

                const userTweets = tweets.filter(x => x.author.id == user.id && Number(x.id) > Number(user.last_tweet))

                if (userTweets.length == 0) continue

                console.log(new Date().toLocaleString());
                for (const notify of user.notifys) {

                    const guild = this.client.guilds.cache.get(notify.guildId)
                    if (!guild) {
                        console.log(`找不到此伺服器`)
                        await notify.remove()
                        continue
                    }

                    const channel = guild?.channels?.cache.get(notify.channelId)
                    if (!channel.isSendable?.()) {
                        console.log(`找不到此頻道`)
                        await notify.remove()
                        continue
                    }

                    for (const tweet of userTweets) {

                        if (!notify.type.includes(tweet?.type)) continue

                        const embeds = [this.Embed.setColor("Blue")
                            .setAuthor(tweet.author.Embed)
                            .setTitle(`${tweet.author.name}${tweet.type}了一篇推文`)
                            .setURL(tweet.URL)
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

                            console.log(`${guild.name} #${channel.name}`.green + " : " + notify.Text?.italic)
                            console.log(`${tweet.author.name}${tweet.type}了一篇推文`.cyan)
                            console.log(tweet.URL.yellow)
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

    //  static notify = SubGroup({ name: "notify", local: "通知" })

    static async FindOrCreateUser(screen_name: string) {
        let dbUser = await db.TwitterUser.findUser(screen_name)
        if (!dbUser) {
            const apiUser = await twitterApi.getUserByScreenName(screen_name)
            await this.List.addMember(apiUser.id)
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
        return dbUser
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
        var users = (await db.TwitterUser.findBy({ enabled: true })).filter(x => x.screen_name.startsWith(current.replace(/(.*?)\/\/(.*?)\/|@/, "").split("?")[0]))
            .map(x => ({ name: x.screen_name, value: x.screen_name }))
        if (users.length <= 5) return users

        var userset = new Set<{ name: string, value: string }>()
        while (userset.size < 5) {
            userset.add(users[Math.randomInt(users.length - 1)])
        }
        return Array.from(userset)
    }

    @Command({ local: "新增通知", name: "notify-create", desc: "若無符合的帳號請自行輸入 通知身分組請直接加入通知訊息中" })
    async notifyCteate(@Option({ local: "帳號", description: "若無符合的帳號請自行輸入", exec: Twitter.allName }) screen_name: string,
        @Option({ local: "通知頻道", description: "要讓機器人發送通知的頻道", channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel: TextChannel,
        @Option({ local: "通知訊息", description: "要標註的身分組以及額外要通知的訊息", required: false }) text?: string) {
        screen_name = screen_name.replace(/(.*?)\/\/(.*?)\/|@/, "").split("?")[0];
        const dbUser = await Twitter.FindOrCreateUser(screen_name)
        if(!dbUser.enabled) return await this.SuccessEmbed(`${inlineCode(screen_name)} 已被封鎖`, true)
        if (await db.TwitterNotify.existsBy({ guildId: this.i.guildId, targetId: dbUser.id }))
            return await this.SuccessEmbed(`伺服器已存在此通知, 如果要更新請使用 ${inlineCode("/twitter notify update")}`, true)

        let notify = db.TwitterNotify.create({ guildId: this.i.guildId, targetId: dbUser.id, channelId: channel.id })
        notify.text = text ?? ""
        notify.target = Promise.resolve(dbUser)
        await notify.save()

        return await this.SuccessEmbed(`已新增通知 ${inlineCode(screen_name)}`, true)
    }

    @Command({ local: "更新通知", name: "notify-update", desc: "更新帳號的通知頻道或訊息" })
    async notifyUpdate(@Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string,
        @Option({ local: "移動至頻道", required: false, channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel?: TextChannel,
        @Option({ local: "新的通知訊息", required: false }) text?: string) {
        const { id } = await Twitter.FindOrCreateUser(screen_name)
        let notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: id })
        if (notify) {
            if (channel?.id) notify.channelId = channel.id
            if (text) notify.text = text
            await notify.save()
            return await this.SuccessEmbed(eb => eb.setDescription(`已更新通知 ${inlineCode(screen_name)}`)
                .addFields({ name: "通知頻道", value: `<#${notify.channelId}>` }, { name: "通知訊息", value: notify.Text ?? "尚未設定" }), true)
        }
        return await this.SuccessEmbed(`伺服器不存在此通知, 如果要新增請使用 ${inlineCode("/twitter notify create")}`, true)
    }

    @Command({ local: "移除通知", name: "notify-remove", desc: "刪除伺服器的通知" })
    async notifyRemove(@Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string) {
        let dbUser = await db.TwitterUser.findUser(screen_name)
        if (dbUser) {
            let notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: dbUser.id })
            if (notify) {
                notify.remove()
                return await this.SuccessEmbed(`已移除通知 ${inlineCode(screen_name)}`, true)
            }
        }
        return await this.SuccessEmbed(`伺服器不存在此通知`, true)
    }

    @Command({ local: "伺服器通知列表", name: "notify-list", desc: "查詢通知列表" })
    async notifyList() {
        let users = "", channels = "", notices = ""
        for (const notify of await db.TwitterNotify.findBy({ guildId: this.i.guildId })) {
            let target = await notify.target
            users += `${inlineCode(target.screen_name)}\n`
            channels += `<#${notify.channelId}>/${(JSON.parse(notify.type) as string[]).map(inlineCode).join(" ")}\n`
            let msg = ""
            if (notify.Text) msg += ` ${notify.Text}`
            notices += `${msg == "" ? "`尚未設定`" : msg}\n`
        }
        if (users == "") await this.SuccessEmbed(`伺服器未加入通知帳號`)
        return await this.SuccessEmbed({
            title: "伺服器推文通知列表",
            fields: [{ name: "使用者", value: users, inline: true },
            { name: "通知頻道/類型", value: channels, inline: true },
            { name: "通知訊息", value: notices, inline: true },
            ]
        }, true)
    }
    @Command({ local: "要通知的推文", name: "subscribe-notify-type", desc: "選擇要通知的推文類型：發佈、轉推、引用、回復 | 預設：發佈、引用" })
    async subscribeNotifyType(@Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string,
        @Option({ local: "發佈", choices: Twitter.YesOrNo, required: false }) post?: number,
        @Option({ local: "轉推", choices: Twitter.YesOrNo, required: false }) retweet?: number,
        @Option({ local: "引用", choices: Twitter.YesOrNo, required: false }) quote?: number,
        @Option({ local: "回復", choices: Twitter.YesOrNo, required: false }) reply?: number
    ) {
        const { id } = await Twitter.FindOrCreateUser(screen_name)
        let notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: id })
        let data = new Set(JSON.parse(notify.type) as string[])
        console.log(data);
        update("發佈", post); update("轉推", retweet); update("引用", quote); update("回復", reply)
        notify.type = JSON.stringify([...data])
        await notify.save()
        return await this.SuccessEmbed(`將會搜尋 ${screen_name} ${[...data].map(inlineCode).join(" ")} 的貼文`, true)

        function update(type: string, value?: number) {
            console.log(type, value);
            if (typeof value !== "number") return;
            if (value) data.add(type)
            else data.delete(type)
        }
    }
}