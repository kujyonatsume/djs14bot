interface Variant {
    bitrate?: number
    content_type: "video/mp4",
    url: string
}
export interface IMedia {
    url: string,
    media_url_https: string,
    type: "video" | "photo" | "animated_gif",
    video_info?: { variants: Variant[] }
}

export class TwitterMedia implements IMedia {
    url: string
    media_url_https: string
    type: "video" | "photo" | "animated_gif"
    variants?: Variant[]
    constructor(data: IMedia) {
        this.url = data.url
        this.media_url_https = data.media_url_https
        this.type = data.type
        this.variants = data.video_info?.variants
    }
    get best_url() {
        return this.variants?.reverse()[0].url ?? this.media_url_https
    }
}