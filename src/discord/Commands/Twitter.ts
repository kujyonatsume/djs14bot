import { db } from "../../db";
import { twitterApi, TwitterList } from "../../twitter";
import { Command, Group, Module, Option } from "../decorator";
import { AutocompleteInteraction, ChannelType, hyperlink, inlineCode, TextChannel, GuildBasedChannel, PermissionFlagsBits } from "discord.js";
import config from "../../config";



const toBig = (v?: string | number | bigint) => BigInt(String(v ?? 0));

@Group({ local: "推文", permission: "Administrator" })
export class Twitter extends Module {
  static List: TwitterList;
  private _running = false;

  async init() {
    Twitter.List =
      (await twitterApi.getLists()).find((x) => x.name === "twitterNotify") ??
      (await twitterApi.ListCreate("twitterNotify", "Powered by TS", true));

    Twitter.List.members = await Twitter.List.getMember();

    for (const u of await db.TwitterUser.find({ select: ["id"], where: { enabled: true } })) {
      if (Twitter.List.members.find((x) => x.id === u.id)) continue;
      await Twitter.List.addMember(u.id);
      await sleep(50);
    }

    console.log(`[Twitter Notify]: ${Twitter.List.members.map((x) => x.screen_name).join(", ")}`);

    setInterval(async () => {
      if (this._running) return;
      this._running = true;
      try {
        await this.Timer();
      } catch (e) {
        console.log(new Date().toLocaleString());
        console.log(e);
        console.log("\n");
      } finally {
        this._running = false;
      }
    }, config.ms);
  }

  private canSendToChannel(ch?: GuildBasedChannel | null) {
    if (!ch) return false;
    // text or announcement channels only
    const isTextLike =
      ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement;
    if (!isTextLike) return false;
    // @ts-ignore - runtime check for send function existence
    if (typeof (ch as any).send !== "function") return false;
    const me = this.client.user?.id;
    if (!me) return false;
    const perms = ch.permissionsFor(me);
    return Boolean(perms?.has(PermissionFlagsBits.ViewChannel) && perms?.has(PermissionFlagsBits.SendMessages));
  }

  private async sendWithRetry(channel: TextChannel, payload: Parameters<TextChannel["send"]>[0]) {
    const max = 3;
    let delay = 500;
    for (let i = 0; i < max; i++) {
      try {
        return await channel.send(payload);
      } catch (e: any) {
        const status = e?.status ?? e?.code;
        if (status === 429 || e?.message?.includes("rate limit")) {
          await sleep(delay);
          delay *= 2;
          continue;
        }
        throw e;
      }
    }
  }

  async Timer() {
    const dbusers = await db.TwitterUser.find({ where: { enabled: true } });
    const tweets = (await Twitter.List.getTweets()).sort((a, b) => (toBig(a.id) < toBig(b.id) ? -1 : 1));

    for (const user of dbusers) {
      if (user.notifys.length === 0) {
        await Twitter.List.removeMember((await user.remove()).id);
        console.log(`已將 ${user.screen_name} 移除`);
        continue;
      }

      const userTweets = tweets.filter((t) => t.author.id === user.id && toBig(t.id) > toBig(user.last_tweet));
      if (userTweets.length === 0) continue;

      console.log(new Date().toLocaleString());

      for (const notify of user.notifys) {
        const guild = this.client.guilds.cache.get(notify.guildId);
        if (!guild) {
          console.log("找不到此伺服器");
          await notify.remove();
          continue;
        }

        const ch = guild.channels.cache.get(notify.channelId) as TextChannel | undefined;
        if (!this.canSendToChannel(ch)) {
          console.log("找不到此頻道或缺少權限");
          await notify.remove();
          continue;
        }

        // 型別集合，預設發佈、引用
        const types = new Set<string>(JSON.parse(notify.type || '["發佈","引用"]'));

        for (const tweet of userTweets) {
          if (!types.has(tweet.type)) continue;

          const embeds = [
            this.Embed
              .setColor("Blue")
              .setAuthor(tweet.author.Embed)
              .setTitle(`${tweet.author.name}${tweet.type}了一篇推文`)
              .setURL(tweet.URL)
              .setDescription(tweet.text ?? "\u200B")
              .setTimestamp(tweet.created_at),
          ];

          if (tweet.urls?.length) {
            const urlBlock = tweet.urls.join("\n");
            if (urlBlock.length > 0) embeds[0].addFields({ name: "連結", value: urlBlock });
          }

          try {
            const content = notify.Text ?? "";
            if (!tweet.medias || tweet.medias.length === 0) {
              await this.sendWithRetry(ch!, { content, embeds });
            } else if (tweet.medias[0].type === "photo") {
              embeds[0].setImage(tweet.medias[0].best_url);
              for (const media of tweet.medias.slice(1, 10)) {
                embeds.push(this.Embed.setColor("Blue").setImage(media.best_url));
              }
              await this.sendWithRetry(ch!, { content, embeds });
            } else {
              await this.sendWithRetry(ch!, { content, embeds });
              const links = tweet.medias.map((m) => hyperlink(m.type, m.best_url)).join("\n");
              await this.sendWithRetry(ch!, { content: links });
            }

            console.log(`${guild.name} #${ch!.name} : ${notify.Text ?? ""}`);
            console.log(`${tweet.author.name}${tweet.type}了一篇推文`);
            console.log(tweet.URL);
          } catch (e) {
            console.log(new Date().toLocaleString());
            console.log(e);
          }

          await sleep(300);
        }
      }

      const last = userTweets[userTweets.length - 1];
      user.last_tweet = String(last.id);
      user.screen_name = last.author.screen_name;
      await user.save();
    }
  }

  static async FindOrCreateUser(screen_name: string) {
    let dbUser = await db.TwitterUser.findUser(screen_name);
    if (!dbUser) {
      const apiUser = await twitterApi.getUserByScreenName(screen_name);
      await this.List.addMember(apiUser.id);
      dbUser = await db.TwitterUser.findId(apiUser.id);
      if (!dbUser) {
        dbUser = db.TwitterUser.create(apiUser);
        const latest = (await twitterApi.getUserTweets(dbUser.id, true)).sort((a, b) => (toBig(b.id) < toBig(a.id) ? -1 : 1))[0];
        dbUser.last_tweet = latest ? String(latest.id) : "0";
        dbUser = await dbUser.save();
      } else {
        await db.TwitterUser.update({ id: apiUser.id }, apiUser);
        dbUser = await db.TwitterUser.findId(apiUser.id);
      }
    }
    return dbUser;
  }

  // Autocomplete helpers
  static async guildNotify(mod: Twitter, i: AutocompleteInteraction, current: string | number) {
    const list = await db.TwitterNotify.findBy({ guildId: i.guildId! });
    const pairs = await Promise.all(
      list.map(async (x) => {
        const user = await x.target;
        return { name: user.screen_name, value: user.screen_name };
      })
    );
    return pairs;
  }

  static async allGuild(mod: Twitter, i: AutocompleteInteraction, current: string | number) {
    return i.client.guilds.cache.map((x) => ({ name: x.name, value: x.id }));
  }

  static async allNotify(mod: Twitter, i: AutocompleteInteraction, current: string) {
    const items = await db.TwitterNotify.find();
    const rows = await Promise.all(
      items.map(async (x) => {
        const user = await x.target;
        return { name: user.screen_name, value: user.screen_name };
      })
    );
    const filtered = rows.filter((r) => r.name.startsWith(current ?? ""));
    return filtered.slice(0, 25);
  }

  static async allName(mod: Twitter, i: AutocompleteInteraction, current: string) {
    const key = (current || "").replace(/(.*?)\/\/(.*?)\/|@/, "").split("?")[0];
    const users = (await db.TwitterUser.findBy({ enabled: true }))
      .filter((x) => x.screen_name.startsWith(key))
      .map((x) => ({ name: x.screen_name, value: x.screen_name }));
    if (users.length <= 5) return users;
    // pick 5 unique deterministic by sort
    return users.sort((a, b) => (a.name < b.name ? -1 : 1)).slice(0, 5);
  }

  @Command({ local: "新增通知", name: "notify-create", desc: "若無符合的帳號請自行輸入 通知身分組請直接加入通知訊息中" })
  async notifyCreate(
    @Option({ local: "帳號", description: "若無符合的帳號請自行輸入", exec: Twitter.allName }) screen_name: string,
    @Option({ local: "通知頻道", description: "要讓機器人發送通知的頻道", channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel: TextChannel,
    @Option({ local: "通知訊息", description: "要標註的身分組以及額外要通知的訊息", required: false }) text?: string
  ) {
    screen_name = screen_name.replace(/(.*?)\/\/(.*?)\/|@/, "").split("?")[0];
    const dbUser = await Twitter.FindOrCreateUser(screen_name);
    if (!dbUser.enabled) return await this.SuccessEmbed(`${inlineCode(screen_name)} 已被封鎖`, true);
    if (await db.TwitterNotify.existsBy({ guildId: this.i.guildId, targetId: dbUser.id }))
      return await this.SuccessEmbed(`伺服器已存在此通知, 如果要更新請使用 ${inlineCode("/twitter notify update")}`, true);

    const notify = db.TwitterNotify.create({ guildId: this.i.guildId, targetId: dbUser.id, channelId: channel.id });
    notify.text = text ?? "";
    notify.target = Promise.resolve(dbUser);
    await notify.save();

    return await this.SuccessEmbed(`已新增通知 ${inlineCode(screen_name)}`, true);
  }

  @Command({ local: "更新通知", name: "notify-update", desc: "更新帳號的通知頻道或訊息" })
  async notifyUpdate(
    @Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string,
    @Option({ local: "移動至頻道", required: false, channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel?: TextChannel,
    @Option({ local: "新的通知訊息", required: false }) text?: string
  ) {
    const { id } = await Twitter.FindOrCreateUser(screen_name);
    const notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: id });
    if (notify) {
      if (channel?.id) notify.channelId = channel.id;
      if (typeof text === "string") notify.text = text;
      // normalize type default if missing
      if (!notify.type) notify.type = '["發佈","引用"]';
      await notify.save();
      return await this.SuccessEmbed(
        (eb) =>
          eb
            .setDescription(`已更新通知 ${inlineCode(screen_name)}`)
            .addFields({ name: "通知頻道", value: `<#${notify.channelId}>` }, { name: "通知訊息", value: notify.Text ?? "尚未設定" }),
        true
      );
    }
    return await this.SuccessEmbed(`伺服器不存在此通知, 如果要新增請使用 ${inlineCode("/twitter notify create")}`, true);
  }

  @Command({ local: "移除通知", name: "notify-remove", desc: "刪除伺服器的通知" })
  async notifyRemove(@Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string) {
    const dbUser = await db.TwitterUser.findUser(screen_name);
    if (dbUser) {
      const notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: dbUser.id });
      if (notify) {
        await notify.remove();
        return await this.SuccessEmbed(`已移除通知 ${inlineCode(screen_name)}`, true);
      }
    }
    return await this.SuccessEmbed(`伺服器不存在此通知`, true);
  }

  @Command({ local: "伺服器通知列表", name: "notify-list", desc: "查詢通知列表" })
  async notifyList() {
    let users = "",
      channels = "",
      notices = "";
    const list = await db.TwitterNotify.findBy({ guildId: this.i.guildId });
    for (const notify of list) {
      const target = await notify.target;
      users += `${inlineCode(target.screen_name)}\n`;
      const typeTags = (JSON.parse(notify.type || '["發佈","引用"]') as string[]).map(inlineCode).join(" ");
      channels += `<#${notify.channelId}>/${typeTags}\n`;
      const msg = notify.Text ? ` ${notify.Text}` : "";
      notices += `${msg === "" ? "`尚未設定`" : msg}\n`;
    }
    if (users === "") await this.SuccessEmbed(`伺服器未加入通知帳號`);
    return await this.SuccessEmbed(
      {
        title: "伺服器推文通知列表",
        fields: [
          { name: "使用者", value: users, inline: true },
          { name: "通知頻道/類型", value: channels, inline: true },
          { name: "通知訊息", value: notices, inline: true },
        ],
      },
      true
    );
  }

  @Command({ local: "要通知的推文", name: "subscribe-notify-type", desc: "選擇要通知的推文類型：發佈、轉推、引用、回復 | 預設：發佈、引用" })
  async subscribeNotifyType(
    @Option({ local: "帳號", exec: Twitter.guildNotify }) screen_name: string,
    @Option({ local: "發佈", choices: Twitter.YesOrNo, required: false }) post?: number,
    @Option({ local: "轉推", choices: Twitter.YesOrNo, required: false }) retweet?: number,
    @Option({ local: "引用", choices: Twitter.YesOrNo, required: false }) quote?: number,
    @Option({ local: "回復", choices: Twitter.YesOrNo, required: false }) reply?: number
  ) {
    const { id } = await Twitter.FindOrCreateUser(screen_name);
    const notify = await db.TwitterNotify.findOneBy({ guildId: this.i.guildId, targetId: id });
    if (!notify) return await this.SuccessEmbed(`伺服器不存在此通知, 請先使用 ${inlineCode("/twitter notify create")}`, true);

    const data = new Set<string>(JSON.parse(notify.type || "[]"));
    const update = (type: string, value?: number) => {
      if (typeof value !== "number") return;
      if (value) data.add(type);
      else data.delete(type);
    };
    update("發佈", post);
    update("轉推", retweet);
    update("引用", quote);
    update("回復", reply);

    if (data.size === 0) {
      data.add("發佈");
      data.add("引用");
    }

    notify.type = JSON.stringify([...data]);
    await notify.save();

    return await this.SuccessEmbed(`將會搜尋 ${screen_name} ${[...data].map(inlineCode).join(" ")} 的貼文`, true);
  }
}