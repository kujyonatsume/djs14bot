import { ChannelType, GuildChannel, hyperlink, inlineCode } from "discord.js";
import { Command, Module, Option } from "../decorator";
import { Twitter } from "./Twitter";
import { db } from "../../db";

export class Support extends Module {
    get isSupported() { return this.i.user.id == this.client.application.owner.id }

    @Command({  name: "insert-twitter-notify", permission: "Administrator", only: true })
    async insertNotify(@Option({ exec: Twitter.allName }) screen_name: string,
        @Option({ local: "通知頻道" }) channelId: string,
        @Option({ local: "通知訊息", required: false }) text?: string) {
        screen_name = screen_name.replace(/(.*?)\/\/(.*?)\/|@/, "").split("?")[0];
        const dbUser = await Twitter.FindOrCreateUser(screen_name)
        const channel = this.client.channels.cache.get(channelId)
        if (!('guildId' in channel && 'send' in channel))
            return await this.SuccessEmbed(`非文字頻道或伺服器不存在此頻道`, true)
        if (await db.TwitterNotify.existsBy({ guildId: channel.guildId, targetId: dbUser.id }))
            return await this.SuccessEmbed(`伺服器已存在此通知`, true)

        let notify = db.TwitterNotify.create({ guildId: channel.guildId, targetId: dbUser.id, channelId })
        notify.text = text ?? ""
        notify.target = Promise.resolve(dbUser)
        await notify.save()

        return await this.SuccessEmbed(`已新增通知 ${inlineCode(screen_name)}`, true)
    }
    @Command({ name: "delete-twitter-notify", permission: "Administrator", only: true })
    async deleteNotify(@Option({ exec: Twitter.allNotify }) screen_name: string) {
        let dbuser = await db.TwitterUser.findUser(screen_name)
        await db.TwitterNotify.remove(dbuser.notifys)
        await dbuser.remove()
        return await this.SuccessEmbed(`已刪除通知資料 ${inlineCode(screen_name)}`, true)
    }
    
    @Command({ name: "list-twitter-notify", permission: "Administrator", only: true })
    async listNotify(@Option({ required:false }) page?: number) {
        page ??= 0
        var users = await db.TwitterUser.find({ where:{ enabled:true }, skip: page * 20 , take: 20 })
        return await this.SuccessEmbed(`已列出通知資料\n${users.map(x => hyperlink(x.name,`${x.url}`)).join('\n')}`, true)
    }

    @Command({ name: "disable-twitter-notify", permission: "Administrator", only: true })
    async disableNotify(@Option({ required:false }) screen_name?: string) {
        let user = await db.TwitterUser.findUser(screen_name)
        user.enabled = false
        Twitter.List.removeMember(user.id)
        for (const n of user.notifys) {
            await n.remove()
        }
        await user.save()
        return await this.SuccessEmbed(`已封鎖 ${inlineCode(screen_name)} 通知`, true)
    }
    
    @Command({ name: "disable-twitter-list", permission: "Administrator", only: true })
    async disableList() {
        let users = await db.TwitterUser.find({ select:['screen_name'], where: { enabled: false } })
        return await this.SuccessEmbed(`已封鎖 ${users.length} 個使用者\n ${users.map(x => x.screen_name).join("、")}`, true)
    }

    @Command({ local: "錯誤回報", name: "report", permission: "Administrator" })
    async report(@Option({ local: "內容" }) msg: string) {
        const { owner } = this.client.application
        let check: any
        if ('send' in owner) {
            check = await owner.send({ embeds: [this.Embed.setColor('Aqua').setDescription(msg).setAuthor({ name: this.i.user.displayName, iconURL: this.i.user.avatarURL() })] })
        }
        if (check) await this.SuccessEmbed(`已回報給開發者`, true)
        else await this.ErrorEmbed(`無法回報給開發者`, true)
    }

    @Command({ local: "幫助", name: "help", permission: "Administrator" })
    async help() {
        await this.SuccessEmbed(x => x.setDescription(`[圖片連結](https://kujyonatsume.github.io/help.jpg)`).setImage("https://kujyonatsume.github.io/help.jpg"))
    }

    @Command({ local: "邀請連結", name: "invite" })
    async invite() {
        await this.SuccessEmbed(`[邀請連結](https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&scope=bot+applications.commands)`, true)
    }
}
