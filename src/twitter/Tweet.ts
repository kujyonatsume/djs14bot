import { twitterApi } from "./Api"
import { IMedia, TwitterMedia } from "./Media"
import { TwitterUser, UserResult } from "./User"

interface TweetResult {
    rest_id: `${number}`,
    core: {
        user_results: { result: UserResult }
    },
    views: { count?: string },
    legacy: TweetLegacy
    quoted_status_result?: { result: TweetResult }
}

interface Entities {
    media?: IMedia[]
    urls?: { expanded_url: string, url: string }[]
}

interface TweetLegacy {
    full_text: string
    created_at: string
    entities?: Entities,
    extended_entities?: {
        media: Entities["media"]
    },
    retweeted_status_result?: { result: TweetResult }
    in_reply_to_status_id_str?: string
    is_quote_status: boolean
    favorite_count: number
    retweet_count: number
    quote_count: number
    bookmark_count: number
    reply_count: number
}

export class TwitterTweet {
    #data: TweetResult
    readonly id: string
    full_text: string
    readonly text: string
    readonly created_at: Date
    medias?: TwitterMedia[]
    urls?: string[]
    readonly author: TwitterUser
    readonly isRetweet: boolean
    readonly isQuote: boolean
    readonly isReply: boolean
    views_count: number
    favorite_count: number
    retweet_count: number
    quote_count: number
    bookmark_count: number
    reply_count: number
    constructor(data: TweetResult) {
        this.#data = data
        if(!data?.legacy) return {} as TwitterTweet;
        
        this.id = data.rest_id
        this.views_count = Number(data.views?.count ?? 0)
        this.full_text = data.legacy.full_text ?? ""
        this.isRetweet = Boolean(data.legacy.retweeted_status_result)
        this.isQuote = Boolean(data.quoted_status_result)
        this.isReply = Boolean(data.legacy.in_reply_to_status_id_str)
        this.favorite_count = data.legacy.favorite_count
        this.retweet_count = data.legacy.retweet_count
        this.quote_count = data.legacy.quote_count
        this.bookmark_count = data.legacy.bookmark_count
        this.reply_count = data.legacy.reply_count
        this.created_at = new Date(data.legacy.created_at)
        this.author = new TwitterUser(data.core.user_results.result)
        this.medias = data.legacy.entities?.media?.map(x => new TwitterMedia(x))
        let link = data.legacy.entities?.urls
        this.urls = link?.map(x => x.expanded_url)
        let text = (this.medias ?? []).reduce((txt, x) => txt.replace(x.url, ""), data.legacy.full_text)
        text = link.reduce((txt, x) => txt.replace(x.url, x.expanded_url), text.replace(/RT @\w+: /, ""))
        this.text = text.length == 0 ? null : text
    }

    get type() {
        return this.isReply ? "回復" : this.isRetweet ? "轉推" : this.isQuote ? "引用" : "發佈"
    }

    get_detail() {
        return twitterApi.getTweetDetail(this.id)
    }

    replied_tweet() {
        if (this.#data.legacy.in_reply_to_status_id_str)
            return twitterApi.getTweetDetail(this.#data.legacy.in_reply_to_status_id_str)
    }
    quoted_tweet() {
        if (this.#data.quoted_status_result)
            return twitterApi.getTweetDetail(this.#data.quoted_status_result?.result.rest_id)
    }
    retweeted_tweet() {
        if (this.#data.legacy.retweeted_status_result)
            return twitterApi.getTweetDetail(this.#data.legacy.retweeted_status_result?.result.rest_id)
    }
}

export class TwitterDetail extends TwitterTweet {
    constructor(private data: TweetResult[], private rest_id: string = "") {
        var curid = data.findIndex(x => x.rest_id == rest_id)
        super(data[curid])
    }
    get_thtead() {
        return this.data.filter(x => x.legacy.in_reply_to_status_id_str == this.rest_id).map(x => new TwitterTweet(x))
    }
}