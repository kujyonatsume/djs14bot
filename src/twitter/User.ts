import { twitterApi } from "./Api"

interface UserLegacy {
    name: string
    created_at: string
    description: string
    profile_banner_url: string
    profile_image_url_https: string
    screen_name: string
    entities: { description: { urls: { expanded_url: string, url: string, }[] } }
}

export interface UserResult {
    rest_id: string;
    legacy: UserLegacy
}

export class TwitterUser {
    id: string;
    created_at: Date
    description: string
    name: string
    banner: string
    icon: string
    screen_name: string
    constructor(data: UserResult) {
        this.id = data.rest_id
        this.name = data.legacy.name
        this.screen_name = data.legacy.screen_name
        this.description = data.legacy.entities.description.urls.reduce((desc, x) => desc.replace(x.url, x.expanded_url), data.legacy.description)
        this.created_at = new Date(data.legacy.created_at)
        this.banner = data.legacy.profile_banner_url
        this.icon = data.legacy.profile_image_url_https
    }
    getTweets(replies?: boolean) {
        return twitterApi.getUserTweets(this.id, replies)
    }
    addToList(listId: string) {
        return twitterApi.ListMemberAdd(listId, this.id)
    }
    removeFormList(listId: string) {
        return twitterApi.ListMemberRemove(listId, this.id)
    }
    get Embed() {
        return { name: `${this.name}(@${this.screen_name})`, iconURL: this.icon, url: `https://x.com/${this.screen_name}` }
    }
}