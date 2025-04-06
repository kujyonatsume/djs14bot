import { twitterApi } from "./Api";
import { TwitterUser } from "./User";

interface IList {
  id_str: string
  name: string
  mode: "Private" | "Public"
  description: string
  default_banner_media: { media_info: { original_img_url: string }; };
  member_count: number;
  created_at: number;
}

export class TwitterList {
  id: string
  name: string
  mode: "Private" | "Public"
  description: string
  member_count: number;
  members: TwitterUser[]
  created_at: Date;
  constructor(data: IList) {
    this.id = data.id_str
    this.name = data.name
    this.mode = data.mode
    this.description = data.description
    this.member_count = data.member_count
    this.created_at = new Date(data.created_at)
  }
  addMember(userId: string) {
    return twitterApi.ListMemberAdd(this.id, userId)
  }
  removeMember(userId: string) {
    return twitterApi.ListMemberRemove(this.id, userId)
  }
  getMember() {
    return twitterApi.getListMember(this.id)
  }
  getTweets() {
    return twitterApi.getListTweets(this.id)
  }
  delete() {
    return twitterApi.ListDelete(this.id)
  }
}