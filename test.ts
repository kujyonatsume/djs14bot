import { TwitterOpenApi } from 'twitter-openapi-typescript';

import json from "./data/config.json";
async function Timer() {
  const api = new TwitterOpenApi();
  const screen_name = "Koyuki_TeRaz"
  const client = await api.getClientFromCookies(json.twitter)
  const response = await client.getUserApi().getUserByScreenName({ screenName: screen_name });
  const userLegacy = response.data?.user.restId;
  (await client.getTweetApi().getUserTweetsAndReplies({ userId: userLegacy, count: 5 })).data?.data
  .forEach(x =>{
    console.log(new Date(x.tweet.legacy.createdAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }), ((x.tweet.legacy.retweeted && "RT" || "") + (x.tweet.legacy.inReplyToStatusIdStr && "RP" || "") + (x.tweet.legacy.isQuoteStatus && "QT" || "") + "PO").slice(0,2));
  })

}

Timer()
