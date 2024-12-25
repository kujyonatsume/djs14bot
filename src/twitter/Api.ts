import axios, { AxiosHeaders, AxiosRequestConfig } from "axios";
import { randomInt, randomUUID } from "crypto";
import { TwitterUser } from "./User";
import jsonpath from "jsonpath";
import { TwitterDetail, TwitterTweet } from "./Tweet";
import { TwitterList } from "./List";

interface CreateTweet { files?: any[], mode?: string, reply_to?: string, quote_tweet_url?: string, card_uri?: string, place_id?: string }

enum MEDIA_TAGS { adult_content = "adult_content", graphic_violence = "graphic_violence", other = "other" }

const askii = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
const queryId = () => new Array<string>(22).fill("").map(() => askii[randomInt(askii.length)]).join("")

//#region api Urls
const GUEST_TOKEN = "https://api.twitter.com/1.1/guest/activate.json"
const HOME_PAGE = "https://twitter.com/"
const API_INIT = "https://twitter.com/i/api/1.1/branch/init.json"
const USER_BY_SCREEN_NAME = "https://twitter.com/i/api/graphql/oUZZZ8Oddwxs8Cd3iW3UEA/UserByScreenName"
const USER_BY_USER_IDS = "https://twitter.com/i/api/graphql/itEhGywpgX9b3GJCzOtSrA/UsersByRestIds"
const USER_TWEETS = "https://twitter.com/i/api/graphql/WzJjibAcDa-oCjCcLOotcg/UserTweets"
const USER_MEDIAS = "https://twitter.com/i/api/graphql/cEjpJXA15Ok78yO4TUQPeQ/UserMedia"
const USER_HIGHLIGHTS = "https://twitter.com/i/api/graphql/eOTTj_P8aj8rRzED2BzzLQ/UserHighlightsTweets"
const USER_LIKES = "https://twitter.com/i/api/graphql/B8I_QCljDBVfin21TTWMqA/Likes"
const USER_TWEETS_WITH_REPLIES = "https://twitter.com/i/api/graphql/1-5o8Qhfc2kWlu_2rWNcug/UserTweetsAndReplies"
const TRENDS = "https://twitter.com/i/api/2/guide.json"
const SEARCH = "https://twitter.com/i/api/graphql/Aj1nGkALq99Xg3XI0OZBtw/SearchTimeline"
const SEARCH_TYPEHEAD = "https://twitter.com/i/api/1.1/search/typeahead.json"
const GIF_SEARCH = "https://twitter.com/i/api/1.1/foundmedia/search.json"
const PLACE_SEARCH = "https://twitter.com/i/api/1.1/geo/places.json"
const TOPIC_LANDING = "https://twitter.com/i/api/graphql/IY9rfrxdSmamr10ZxvVBxg/TopicLandingPage"
const AUDIO_SPACE_BY_ID = "https://twitter.com/i/api/graphql/gpc0LEdR6URXZ7HOo42_bQ/AudioSpaceById"
const AUDIO_SPACE_STREAM = "https://twitter.com/i/api/1.1/live_video_stream/status/{id}"
const TWEET_DETAILS = "https://twitter.com/i/api/graphql/3XDB26fBve-MmjHaWTUZxA/TweetDetail"
const TWEET_ANALYTICS = "https://twitter.com/i/api/graphql/vnwexpl0q33_Bky-SROVww/TweetActivityQuery"
const TWEET_DETAILS_AS_GUEST = "https://api.twitter.com/graphql/5GOHgZe-8U2j5sVHQzEm9A/TweetResultByRestId"
const TWEET_HISTORY = "https://twitter.com/i/api/graphql/MYJ08HcXJuxtXMXWMP-63w/TweetEditHistory"
const AUSER_INBOX = "https://twitter.com/i/api/1.1/dm/user_updates.json"
const AUSER_NOTIFICATION_MENTIONS = "https://twitter.com/i/api/2/notifications/mentions.json"
const AUSER_SETTINGS = "https://api.twitter.com/1.1/account/settings.json"
const AUSER_ADD_GROUP_MEMBER = "https://twitter.com/i/api/graphql/oBwyQ0_xVbAQ8FAyG0pCRA/AddParticipantsMutation"
const AUSER_SEND_MESSAGE = "https://twitter.com/i/api/1.1/dm/new2.json"
const AUSER_CONVERSATION = "https://twitter.com/i/api/1.1/dm/conversation/{id}.json"
const AUSER_CREATE_TWEET = "https://twitter.com/i/api/graphql/tTsjMKyhajZvK4q76mpIBg/CreateTweet"
const AUSER_DELETE_TWEET = "https://twitter.com/i/api/graphql/VaenaVgh5q5ih7kvyVjgtg/DeleteTweet"
const AUSER_CREATE_POOL = "https://caps.twitter.com/v2/cards/create.json"
const AUSER_VOTE_POOL = "https://caps.twitter.com/v2/capi/passthrough/1"
const AUSER_CREATE_TWEET_SCHEDULE = "https://twitter.com/i/api/graphql/LCVzRQGxOaGnOnYH01NQXg/CreateScheduledTweet"
const AUSER_CREATE_MEDIA = "https://upload.twitter.com/i/media/upload.json"
const AUSER_CREATE_MEDIA_METADATA = "https://twitter.com/i/api/1.1/media/metadata/create.json"
const AUSER_BOOKMARK = "https://twitter.com/i/api/graphql/bN6kl72VsPDRIGxDIhVu7A/Bookmarks"
const AUSER_HOME_TIMELINE = "https://twitter.com/i/api/graphql/W4Tpu1uueTGK53paUgxF0Q/HomeTimeline"
const AUSER_HOME_TIMELINE_LATEST = "https://twitter.com/i/api/graphql/IjTuxEFmAb6DvzycVz4fHg/HomeLatestTimeline"
const AUSER_TWEET_FAVOURITERS = "https://twitter.com/i/api/graphql/yoghorQ6KbhB1qpXefXuLQ/Favoriters"
const AUSER_TWEET_RETWEETERS = "https://twitter.com/i/api/graphql/_nBuZh82i3A0Ohkjw4FqCg/Retweeters"
const AUSER_LIKE_TWEET = "https://twitter.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet"
const AUSER_UNLIKE_TWEET = "https://twitter.com/i/api/graphql/ZYKSe-w7KEslx3JhSIk5LA/UnfavoriteTweet"
const AUSER_BOOKMARK_TWEET = "https://twitter.com/i/api/graphql/aoDbu3RHznuiSkQ9aNM67Q/CreateBookmark"
const AUSER_BOOKMARK_DELETE_TWEET = "https://twitter.com/i/api/graphql/Wlmlj2-xzyS1GN3a6cj-mQ/DeleteBookmark"
const AUSER_POST_TWEET_RETWEET = "https://twitter.com/i/api/graphql/ojPdsZsimiJrUGLR1sjUtA/CreateRetweet"
const AUSER_DELETE_TWEET_RETWEET = "https://twitter.com/i/api/graphql/iQtK4dl5hBmXewYZuEOKVw/DeleteRetweet"
const AUSER_CREATE_FRIEND = "https://twitter.com/i/api/1.1/friendships/create.json"
const AUSER_DESTROY_FRIEND = "https://twitter.com/i/api/1.1/friendships/destroy.json"
const AUSER_UPDATE_FRIEND = "https://twitter.com/i/api/1.1/friendships/update.json"
const AUSER_BLOCK_FRIEND = "https://twitter.com/i/api/1.1/blocks/create.json"
const AUSER_UNBLOCK_FRIEND = "https://twitter.com/i/api/1.1/blocks/destroy.json"
const AUSER_GET_COMMUNITY = "https://twitter.com/i/api/graphql/wYwM9x1NTCQKPx50Ih35Tg/CommunitiesFetchOneQuery"
const AUSER_GET_COMMUNITY_TWEETS = "https://twitter.com/i/api/graphql/X3ziwTzWWeaFPsesEwWY-A/CommunityTweetsTimeline"
const AUSER_GET_COMMUNITY_TWEETS_TOP = "https://twitter.com/i/api/graphql/UwEaY0_gBZFCQq-gEnArjg/CommunityTweetsRankedTimeline"
const AUSER_GET_COMMUNITY_MEMBERS = "https://twitter.com/i/api/graphql/uDM1rSTpOPMuhBCf2mun9Q/membersSliceTimeline_Query"
const AUSER_GET_COMMUNITY_MEMBERS_MODERATOR = "https://twitter.com/i/api/graphql/DB68-nKYyzPN8tXKr5xZng/moderatorsSliceTimeline_Query"
const AUSER_GET_NOTIFICATION_USER_FOLLOWED = "https://twitter.com/i/api/2/notifications/device_follow.json"
const AUSER_GET_LISTS = "https://twitter.com/i/api/graphql/xoietOOE63W0cH9LFt4yRA/ListsManagementPageTimeline"
const AUSER_GET_LIST = "https://twitter.com/i/api/graphql/zNcfphEciDXgu0vdIMhSaA/ListByRestId"
const AUSER_GET_LIST_MEMBER = "https://twitter.com/i/api/graphql/WWxrex_8HmKW2dzlPnwtTg/ListMembers"
const AUSER_GET_LIST_TWEETS = "https://twitter.com/i/api/graphql/TXyJ3x6-VnEbkV09UzebUQ/ListLatestTweetsTimeline"
const AUSER_ADD_LIST_MEMBER = "https://twitter.com/i/api/graphql/sw71TVciw1b2nRwV6eDZNA/ListAddMember"
const AUSER_DELETE_LIST_MEMBER = "https://twitter.com/i/api/graphql/kHdBGndqf_JX3ef1T1931A/ListRemoveMember"
const AUSER_CREATE_LIST = "https://twitter.com/i/api/graphql/nHFMQuE4PMED1R0JTN4d-Q/CreateList"
const AUSER_DELETE_LIST = "https://twitter.com/i/api/graphql/UnN9Th1BDbeLjpgjGSpL3Q/DeleteList"
const AUSER_GET_USER_FOLLOWERS = "https://twitter.com/i/api/graphql/ihMPm0x-pC35X86L_nUp_Q/Followers"
const AUSER_GET_USER_FOLLOWINGS = "https://twitter.com/i/api/graphql/bX-gXhcglOa--1gzgDlb8A/Following"
const AUSER_GET_MUTUAL_FRIENDS = "https://twitter.com/i/api/graphql/35Y2QFmL84HIisnm-FHAng/FollowersYouKnow"
const AUSER_GET_BLOCKED_USERS = "https://twitter.com/i/api/graphql/f87G4V_l5E9rJ-Ylw0D-yQ/BlockedAccountsAll"
//#endregion

const headers = new AxiosHeaders({
    authority: "twitter.com",
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    Authorization: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
    "Content-Type": "application/json",
    Referer: "https://twitter.com",
    "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Opera";v="108"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0",
    "X-Twitter-Active-User": "yes",
    "X-Twitter-Auth-Type": "OAuth2Session",
    "X-Twitter-Client-Language": "zh-tw"
})
/**
 * 1 2 "4 5"
 */
type KeyWord = `"${string}"`|string
interface SearchData {
    hasWords: KeyWord[];
    except: string[]; // -1 -2 -3
    orWord: string[]; //(1 2 3)
    tags: string[];   // (#1 #2)
    user: string; // (from:NemesisXDFP)
}

class TwitterApi {
    //#region base methods
    setCookie(cookie: { auth_token: string; ct0: string }) {
        headers.Cookie = Object.entries(cookie).map(x => x.join("=")).join(";")
        headers["X-Csrf-Token"] = cookie.ct0
        return this
    }

    private async get(url: string, params?: any) {
        const x = await axios.get(url, { headers, params });
        return x.data;
    }

    private async post(url: string, config: AxiosRequestConfig<any> = {}) {
        const x = await axios.post(url, config.data, { headers, ...config });
        return x.data;
    }

    private async postUserForm(url: string, user_id: string) {
        const x = await axios.postForm(url, {
            'include_profile_interstitial_type': '1',
            'include_blocking': '1',
            'include_blocked_by': '1',
            'include_followed_by': '1',
            'include_want_retweets': '1',
            'include_mute_edge': '1',
            'include_can_dm': '1',
            'include_can_media_tag': '1',
            'include_ext_has_nft_avatar': '1',
            'include_ext_is_blue_verified': '1',
            'include_ext_verified_type': '1',
            'include_ext_profile_image_shape': '1',
            'skip_status': '1', user_id,
        }, { headers: { ...headers, "Content-Type": 'application/x-www-form-urlencoded', } });
        return x.data;
    }

    getGuestToken() {
        return this.post(GUEST_TOKEN)
    }

    getGuestTokenFallback() {
        return this.get(HOME_PAGE)
    }

    init() {
        return this.post(API_INIT)
    }

    //#endregion

    async getUserByScreenName(screen_name: string) {
        const res = await this.get(USER_BY_SCREEN_NAME, {
            variables: JSON.stringify({ screen_name, "withSafetyModeUserFields": true }),
            features: JSON.stringify({
                "hidden_profile_likes_enabled": false,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "subscriptions_verification_info_verified_since_enabled": true,
                "highlights_tweets_tab_ui_enabled": true,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true
            })
        });
        return new TwitterUser(res.data.user.result);
    }

    async getUserById(userId: string) {
        const users = await this.getUsersById([userId]);
        return users[0];
    }

    async getUsersById(userIds: string[]) {
        const res: any = await this.get(USER_BY_USER_IDS, {
            variables: JSON.stringify({ userIds }), features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true
            })
        });
        return res.data.users.map((x: any) => new TwitterUser(x.result));
    }

    getUserMedia(userId: string) {
        return this.get(USER_MEDIAS, {
            variables: JSON.stringify({
                userId,
                "count": 20,
                "includePromotedContent": false,
                "withClientEventToken": false,
                "withBirdwatchNotes": false,
                "withVoice": true,
                "withV2Timeline": true
            }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "rweb_video_timestamps_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getUserHighlights(userId: string) {
        return this.get(USER_HIGHLIGHTS, {
            variables: JSON.stringify({
                userId, "count": 20, "includePromotedContent": true,
                "withVoice": true
            }
            ), features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": true,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "rweb_video_timestamps_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_enhance_cards_enabled": false
            }



            )
        }

        )
    }

    getUserLikes(userId: string) {
        return this.get(USER_LIKES, {
            variables: JSON.stringify({
                userId, "count": 20, "includePromotedContent": false,
                "withClientEventToken": false,
                "withBirdwatchNotes": false,
                "withVoice": true,
                "withV2Timeline": true
            }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": true,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": true,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "rweb_video_timestamps_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    async getUserTweets(userId: string, replies = false,) {
        let features: any
        let fieldToggles: any = { "withArticleRichContentState": false }
        let variables: any = {
            userId,
            "count": 20,
            "includePromotedContent": true,
            "withCommunity": true,
            "withVoice": true,
            "withV2Timeline": true
        }

        if (!replies) {
            variables.withQuickPromoteEligibilityTweetFields = true
            features = {
                "rweb_lists_timeline_redesign_enabled": true,
                "blue_business_profile_image_shape_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "vibe_api_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": false,
                "interactive_text_enabled": true,
                "responsive_web_text_conversations_enabled": false,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            }

        }
        else {
            fieldToggles.withAuxiliaryUserLabels = false
            features = {
                "rweb_lists_timeline_redesign_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            }
        }

        const res = await this.get(replies ? USER_TWEETS_WITH_REPLIES : USER_TWEETS, {
            variables: JSON.stringify(variables), features: JSON.stringify(features),
            fieldToggles: JSON.stringify(fieldToggles)
        })
        return jsonpath.query(res, "$..tweet_results.result").map(x => new TwitterTweet(x))
    }

    trends() {
        return this.get(TRENDS, {
            'include_profile_interstitial_type': '1',
            'include_blocking': '1',
            'include_blocked_by': '1',
            'include_followed_by': '1',
            'include_want_retweets': '1',
            'include_mute_edge': '1',
            'include_can_dm': '1',
            'include_can_media_tag': '1',
            'include_ext_has_nft_avatar': '1',
            'include_ext_is_blue_verified': '1',
            'include_ext_verified_type': '1',
            'skip_status': '1',
            'cards_platform': 'Web-12',
            'include_cards': '1',
            'include_ext_alt_text': true,
            'include_ext_limited_action_results': false,
            'include_quote_count': true,
            'include_reply_count': '1',
            'tweet_mode': 'extended',
            'include_ext_collab_control': true,
            'include_ext_views': true,
            'include_entities': true,
            'include_user_entities': true,
            'include_ext_media_color': true,
            'include_ext_media_availability': true,
            'include_ext_sensitive_media_warning': true,
            'include_ext_trusted_friends_metadata': true,
            'send_error_codes': true,
            'simple_quoted_tweet': true,
            'count': '100',
            'requestContext': 'launch',
            'candidate_source': 'trends',
            'include_page_configuration': false,
            'entity_tokens': false,
            'ext': 'mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,enrichments,superFollowMetadata,unmentionInfo,editControl,collab_control,vibe',
        })
    }

    SearchWithOption(rawData: SearchData) {
        var q = rawData.hasWords.join(' ') + 
        rawData.except.join(' -') +
        ' (form:' + rawData.user+') ('+
        rawData.orWord.join(' OR ') + ')'
        return this.Search(q)
    }
    Search(rawQuery: string, product: "Top" | "Latest" = "Latest") {
        return this.get(SEARCH, {
            variables: JSON.stringify({ rawQuery, "count": 20, "querySource": "typed_query", product }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_home_pinned_timelines_enabled": true,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false,
                "rweb_lists_timeline_redesign_enabled": false,
                "rweb_video_timestamps_enabled": true
            })
        })
    }

    SearchPlace(lat?: any, long?: any, search_term?: any) {
        let params: any = { 'query_type': 'tweet_compose_location' }
        if (lat && long) params = { ...params, lat, long }
        if (search_term) params = { ...params, search_term }
        return this.get(PLACE_SEARCH, params)
    }

    SearchTypehead(q: string, result_type: Array<"events" | "users" | "topics" | "lists"> = ["events", "users", "topics", "lists"]) {
        return this.get(SEARCH_TYPEHEAD, {
            'include_profile_interstitial_type': '1',
            'include_blocking': '1',
            'include_blocked_by': '1',
            'include_followed_by': '1',
            'include_want_retweets': '1',
            'include_mute_edge': '1',
            'include_can_dm': '1',
            'include_can_media_tag': '1',
            'include_ext_has_nft_avatar': '1',
            'include_ext_is_blue_verified': '1',
            'include_ext_verified_type': '1',
            'include_ext_profile_image_shape': '1',
            'include_entities': '1',
            q,
            'src': 'search_box',
            'result_type': result_type.join(','),
        })
    }

    async getTweetDetail(focalTweetId: string) {
        const res = await this.get(TWEET_DETAILS, {
            variables: JSON.stringify({
                focalTweetId,
                "with_rux_injections": false,
                "includePromotedContent": true,
                "withCommunity": true,
                "withQuickPromoteEligibilityTweetFields": true,
                "withBirdwatchNotes": true,
                "withVoice": true,
                "withV2Timeline": true
            }),
            features: JSON.stringify({
                "rweb_lists_timeline_redesign_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            }),
            fieldToggles: JSON.stringify({ "withArticleRichContentState": false })
        })
        return new TwitterDetail(jsonpath.query(res, "$..tweet_results.result"), focalTweetId)

    }

    getTweetDetail_AsGuest(tweetId: string) {
        const res = this.get(TWEET_DETAILS_AS_GUEST, {
            variables: JSON.stringify({
                tweetId, "withCommunity": false,
                "includePromotedContent": true,
                "withVoice": false
            }),
            features: JSON.stringify({
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "responsive_web_home_pinned_timelines_enabled": true,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_enhance_cards_enabled": false
            })
        })
        return new TwitterDetail(jsonpath.query(res, "$..tweet_results.result"), tweetId)
    }

    getTweetEditHistory(tweetId: string) {
        return this.get(TWEET_HISTORY, {
            variables: JSON.stringify({ tweetId, "withQuickPromoteEligibilityTweetFields": true }),
            features: JSON.stringify({
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "rweb_video_timestamps_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getTweetAnalytics(restId: string) {
        return this.get(TWEET_ANALYTICS, {
            variables: JSON.stringify({
                restId, "from_time": "2011-01-01T00:00:00.000Z",
                "to_time": "2050-02-20T14:07:53.617Z",
                "first_48_hours_time": "2023-12-30T10:36:27.000Z",
                "requested_organic_metrics": ["DetailExpands", "Engagements", "Follows", "Impressions", "LinkClicks", "ProfileVisits"],
                "requested_promoted_metrics": ["DetailExpands", "Engagements", "Follows", "Impressions", "LinkClicks", "ProfileVisits", "CostPerFollower"]
            }),
            features: JSON.stringify({ "responsive_web_tweet_analytics_m3_enabled": false })
        })
    }

    getBlockedUsers() {
        return this.get(AUSER_GET_BLOCKED_USERS, {
            variables: JSON.stringify({
                "count": 100,
                "includePromotedContent": false,
                "withSafetyModeUserFields": false
            }), features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": true,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "rweb_video_timestamps_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getMentions() {
        return this.get(AUSER_NOTIFICATION_MENTIONS, {
            'include_profile_interstitial_type': '1',
            'include_blocking': '1',
            'include_blocked_by': '1',
            'include_followed_by': '1',
            'include_want_retweets': '1',
            'include_mute_edge': '1',
            'include_can_dm': '1',
            'include_can_media_tag': '1',
            'include_ext_has_nft_avatar': '1',
            'include_ext_is_blue_verified': '1',
            'include_ext_verified_type': '1',
            'include_ext_profile_image_shape': '1',
            'skip_status': '1',
            'cards_platform': 'Web-12',
            'include_cards': '1',
            'include_ext_alt_text': true,
            'include_ext_limited_action_results': true,
            'include_quote_count': true,
            'include_reply_count': '1',
            'tweet_mode': 'extended',
            'include_ext_views': true,
            'include_entities': true,
            'include_user_entities': true,
            'include_ext_media_color': true,
            'include_ext_media_availability': true,
            'include_ext_sensitive_media_warning': true,
            'include_ext_trusted_friends_metadata': true,
            'send_error_codes': true,
            'simple_quoted_tweet': true,
            'count': '20',
            'requestContext': 'launch',
            'ext': 'mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl',
        })
    }

    getInbox(active_conversation_id?: string) {
        let params: any = {
            'nsfw_filtering_enabled': false,
            'filter_low_quality': true,
            'include_quality': 'all',
            'dm_secret_conversations_enabled': false,
            'krs_registration_enabled': true,
            'cards_platform': 'Web-12',
            'include_cards': '1',
            'include_ext_alt_text': true,
            'include_ext_limited_action_results': true,
            'include_quote_count': true,
            'include_reply_count': '1',
            'tweet_mode': 'extended',
            'include_ext_views': true,
            'dm_users': false,
            'include_groups': true,
            'include_inbox_timelines': true,
            'include_ext_media_color': true,
            'supports_reactions': true,
            'include_ext_edit_control': true,
            'include_ext_business_affiliations_label': true,
            'ext': 'mediaColor,altText,businessAffiliationsLabel,mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl',
        }
        if (active_conversation_id)
            params['active_conversation_id'] = active_conversation_id
        return this.get(AUSER_INBOX, params)
    }

    getConversationMessages(conversation_id: string, max_id = null) {
        let params: any = {
            'context': 'FETCH_DM_CONVERSATION',
            'include_profile_interstitial_type': '1',
            'include_blocking': '1',
            'include_blocked_by': '1',
            'include_followed_by': '1',
            'include_want_retweets': '1',
            'include_mute_edge': '1',
            'include_can_dm': '1',
            'include_can_media_tag': '1',
            'include_ext_has_nft_avatar': '1',
            'include_ext_is_blue_verified': '1',
            'include_ext_verified_type': '1',
            'include_ext_profile_image_shape': '1',
            'skip_status': '1',
            'dm_secret_conversations_enabled': 'false',
            'krs_registration_enabled': true,
            'cards_platform': 'Web-12',
            'include_cards': '1',
            'include_ext_alt_text': true,
            'include_ext_limited_action_results': true,
            'include_quote_count': true,
            'include_reply_count': '1',
            'tweet_mode': 'extended',
            'include_ext_views': true,
            'dm_users': 'false',
            'include_groups': true,
            'include_inbox_timelines': true,
            'include_ext_media_color': true,
            'supports_reactions': true,
            'include_conversation_info': true,
            'ext': 'mediaColor,altText,mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl',
        }

        if (max_id)
            params['max_id'] = max_id

        return this.get(AUSER_CONVERSATION.replace("{id}", conversation_id), params)
    }

    AddMemberToGroup(member_ids: string, conversation_id: string) {
        return this.post(AUSER_ADD_GROUP_MEMBER, {
            data: {
                variables: {
                    'addedParticipants': member_ids,
                    'conversationId': conversation_id,
                },
                'queryId': queryId(),
            }
        })
    }

    getBookMarks() {
        return this.get(AUSER_BOOKMARK, {
            variables: JSON.stringify({ "count": 20, "includePromotedContent": true }),
            features: JSON.stringify({
                "graphql_timeline_v2_bookmark_timeline": true,
                "rweb_lists_timeline_redesign_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            }),
            fieldToggles: JSON.stringify({
                "withAuxiliaryUserLabels": false,
                "withArticleRichContentState": false
            })
        })
    }

    sendMessage(conversation_id: string, text: string, media_id?: string) {
        let data: any = {
            conversation_id,
            'recipient_ids': false,
            'request_id': randomUUID(),
            'text': text,
            'cards_platform': 'Web-12',
            'include_cards': 1,
            'include_quote_count': true,
            'dm_users': false,
        }
        if (media_id) data['media_id'] = media_id

        return this.post(AUSER_SEND_MESSAGE, {
            data, params: {
                'ext': 'mediaColor,altText,mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl',
                'include_ext_alt_text': true,
                'include_ext_limited_action_results': true,
                'include_reply_count': '1',
                'tweet_mode': 'extended',
                'include_ext_views': true,
                'include_groups': true,
                'include_inbox_timelines': true,
                'include_ext_media_color': true,
                'supports_reactions': true,
            }
        })
    }

    CreatePool(pool: any) {
        return this.post(AUSER_CREATE_POOL, { params: { "card_data": pool } })
    }

    TweetDelete(tweet_id: string) {
        return this.post(AUSER_DELETE_TWEET, {
            data: {
                variables: { tweet_id, 'dark_request': false, },
                'queryId': queryId()
            }
        })
    }

    TweetCreate(tweet_text: string, data: CreateTweet = {}) {
        let variables: any = {
            tweet_text,
            'dark_request': false,
            'media': {
                'media_entities': data.files?.map(file => ({
                    "media_id": file.media_id ?? file,
                    "tagged_users": []
                })),
                'possibly_sensitive': false,
            },
            'semantic_annotation_ids': []
        }

        if (data.reply_to)
            variables['reply'] = {
                'exclude_reply_user_ids': [],
                'in_reply_to_tweet_id': data.reply_to
            }
        else if (data.quote_tweet_url)
            variables['attachment_url'] = data.quote_tweet_url

        if (data.mode) variables['conversation_control'] = { mode: data.mode }

        if (data.card_uri) variables['card_uri'] = data.place_id

        if (data.place_id) variables['geo'] = { place_id: data.place_id }

        return this.post(AUSER_CREATE_TWEET, {
            data: {
                queryId: queryId(),
                variables,
                features: {
                    'tweetypie_unmention_optimization_enabled': true,
                    'responsive_web_edit_tweet_api_enabled': true,
                    'graphql_is_translatable_rweb_tweet_is_translatable_enabled': true,
                    'view_counts_everywhere_api_enabled': true,
                    'longform_notetweets_consumption_enabled': true,
                    'responsive_web_twitter_article_tweet_consumption_enabled': false,
                    'tweet_awards_web_tipping_enabled': false,
                    'longform_notetweets_rich_text_read_enabled': true,
                    'longform_notetweets_inline_media_enabled': true,
                    'responsive_web_graphql_exclude_directive_enabled': true,
                    'verified_phone_label_enabled': false,
                    'freedom_of_speech_not_reach_fetch_enabled': true,
                    'standardized_nudges_misinfo': true,
                    'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled': true,
                    'responsive_web_media_download_video_enabled': false,
                    'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
                    'responsive_web_graphql_timeline_navigation_enabled': true,
                    'responsive_web_enhance_cards_enabled': false
                },
                fieldToggles: {
                    'withArticleRichContentState': false,
                    'withAuxiliaryUserLabels': false
                }
            }
        })
    }

    PollVote(poll_id: string, poll_name: string, tweet_id: string, choice: string) {
        return this.post(AUSER_VOTE_POOL, {
            params: {
                'twitter:string:card_uri': poll_id,
                'twitter:long:original_tweet_id': tweet_id,
                'twitter:string:response_card_name': poll_name,
                'twitter:string:cards_platform': 'Web-12',
                'twitter:string:selected_choice': choice,
            }
        })
    }

    ScheduleCreateTweet(text: string, files: string, time: string) {
        return this.post(AUSER_CREATE_TWEET_SCHEDULE, {
            data: {
                queryId: queryId(),
                variables: {
                    'post_tweet_request': {
                        'auto_populate_reply_metadata': false,
                        'status': text,
                        'exclude_reply_user_ids': [],
                        'media_ids': files
                    },
                    'execute_at': time,
                }
            }
        })
    }

    SetMediaMetadata(media_id: string, text: string, sensitive_tags?: MEDIA_TAGS[]) {
        let data: any = { media_id, 'alt_text': { text } }
        if (sensitive_tags) data['sensitive_media_warning'] = sensitive_tags
        return this.post(AUSER_CREATE_MEDIA_METADATA, { data })
    }

    UploadMediaInit(source: number | string, mime_type: string, media_category: string) {
        return this.post(AUSER_CREATE_MEDIA, {
            params: {
                'command': 'INIT',
                'media_type': mime_type,
                'media_category': media_category,
                [typeof source == 'number' ? 'total_bytes' : 'source_url']: `${source}`
            }
        })
    }

    UploadMediaAppend(media_id: string, segment_index: string) {
        return this.post(AUSER_CREATE_MEDIA, {
            params: {
                'command': 'APPEND',
                'media_id': media_id,
                'segment_index': segment_index,
            }
        })
    }

    UploadMediaFinalize(media_id: string, md5_hash?: string) {
        let params: any = { 'command': 'FINALIZE', media_id }
        if (md5_hash) params['original_md5'] = md5_hash
        return this.post(AUSER_CREATE_MEDIA, { params })
    }

    UploadMediaStatus(media_id: string) {
        return this.get(AUSER_CREATE_MEDIA, { 'command': 'STATUS', media_id })
    }

    getHomeTimeLine() {
        return this.HomeTimeLine(false)
    }

    getHomeTimeLineLatest() {
        return this.HomeTimeLine(true)
    }

    private HomeTimeLine(latest: boolean) {
        return this.get(latest ? AUSER_HOME_TIMELINE_LATEST : AUSER_HOME_TIMELINE, {
            variables: JSON.stringify({
                'count': 20,
                'includePromotedContent': true,
                'latestControlAvailable': true,
                'requestContext': 'launch',
                'withCommunity': true,
                'seenTweetIds': [],
            }),
            features: JSON.stringify({
                'rweb_lists_timeline_redesign_enabled': true,
                'responsive_web_graphql_exclude_directive_enabled': true,
                'verified_phone_label_enabled': false,
                'creator_subscriptions_tweet_preview_api_enabled': true,
                'responsive_web_graphql_timeline_navigation_enabled': true,
                'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
                'tweetypie_unmention_optimization_enabled': true,
                'responsive_web_edit_tweet_api_enabled': true,
                'graphql_is_translatable_rweb_tweet_is_translatable_enabled': true,
                'view_counts_everywhere_api_enabled': true,
                'longform_notetweets_consumption_enabled': true,
                'responsive_web_twitter_article_tweet_consumption_enabled': false,
                'tweet_awards_web_tipping_enabled': false,
                'freedom_of_speech_not_reach_fetch_enabled': true,
                'standardized_nudges_misinfo': true,
                'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled': true,
                'longform_notetweets_rich_text_read_enabled': true,
                'longform_notetweets_inline_media_enabled': true,
                'responsive_web_media_download_video_enabled': false,
                'responsive_web_enhance_cards_enabled': false,
                'rweb_video_timestamps_enabled': true,
                'c9s_tweet_anatomy_moderator_badge_enabled': true
            }),
            queryId: queryId()
        })
    }

    getTweetLikes(tweetId: string) {
        return this.get(AUSER_TWEET_FAVOURITERS, {
            variables: JSON.stringify({ tweetId, "count": 20, "includePromotedContent": true }),
            features: JSON.stringify({
                "rweb_lists_timeline_redesign_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getRetweets(tweet_id: string,) {
        return this.get(AUSER_TWEET_RETWEETERS, {
            variables: JSON.stringify({ "tweetId": tweet_id, "count": 20, "includePromotedContent": true }),
            features: JSON.stringify({
                "rweb_lists_timeline_redesign_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getAudioSpace(audio_space_id: string) {
        return this.get(AUDIO_SPACE_BY_ID, {
            variables: JSON.stringify({
                "id": audio_space_id, "isMetatagsQuery": false,
                "withReplays": true,
                "withListeners": true
            }),
            features: JSON.stringify({
                "spaces_2022_h2_spaces_communities": true,
                "spaces_2022_h2_clipping": true,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getAudioStream(media_key: string) {
        return this.get(AUDIO_SPACE_STREAM.replace("{id}", media_key), {
            'client': 'web',
            'use_syndication_guest_id': 'false',
            'cookie_set_host': 'twitter.com',
        })
    }

    postTweetLike(tweet_id: string) {
        return this.post(AUSER_LIKE_TWEET, {
            data: { variables: { tweet_id }, 'queryId': queryId() }
        })
    }

    postTweetUnlike(tweet_id: string) {
        return this.post(AUSER_UNLIKE_TWEET, {
            data: { variables: { tweet_id }, 'queryId': queryId() }
        })
    }

    postBookMark(tweet_id: string) {
        return this.post(AUSER_BOOKMARK_TWEET, {
            data: { variables: { tweet_id }, 'queryId': queryId() }
        })
    }

    postBookMarkRemove(tweet_id: string) {
        return this.post(AUSER_BOOKMARK_DELETE_TWEET, {
            data: { variables: { tweet_id }, 'queryId': queryId() }
        })
    }

    postReTweet(tweet_id: string) {
        return this.post(AUSER_POST_TWEET_RETWEET, {
            data: { variables: { tweet_id, 'dark_request': false, }, 'queryId': queryId() }
        })
    }

    postReTweetRemove(source_tweet_id: string) {
        return this.post(AUSER_DELETE_TWEET_RETWEET, {
            data: { variables: { source_tweet_id, 'dark_request': false, }, 'queryId': queryId() }
        })
    }

    postUserFollow(user_id: string) {
        return this.postUserForm(AUSER_CREATE_FRIEND, user_id)
    }

    postUserUnfollow(user_id: string) {
        return this.postUserForm(AUSER_DESTROY_FRIEND, user_id)
    }

    postUserBlock(user_id: string) {
        return this.postUserForm(AUSER_BLOCK_FRIEND, user_id)
    }

    postUserUnblock(user_id: string) {
        return this.postUserForm(AUSER_UNBLOCK_FRIEND, user_id)
    }

    getUserFollowers(userId: string) {
        return this.get(AUSER_GET_USER_FOLLOWERS, {
            variables: JSON.stringify({ userId, "count": 50, "includePromotedContent": false }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_home_pinned_timelines_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getUserFollowings(userId: string) {
        return this.get(AUSER_GET_USER_FOLLOWINGS, {
            variables: JSON.stringify({ userId, "count": 50, "includePromotedContent": false }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_home_pinned_timelines_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getCommunity(communityId: string) {
        return this.get(AUSER_GET_COMMUNITY, {
            variables: JSON.stringify({
                communityId, "withDmMuting": false,
                "withSafetyModeUserFields": false
            }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "verified_phone_label_enabled": false
            })
        })
    }

    getCommunityTweets(communityId: string, top = false) {
        return this.get(top ? AUSER_GET_COMMUNITY_TWEETS_TOP : AUSER_GET_COMMUNITY_TWEETS, {
            variables: JSON.stringify({ "count": 20, communityId, "withCommunity": true }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    getCommunityMembers(communityId: string, mods = false) {
        return this.get(mods ? AUSER_GET_COMMUNITY_MEMBERS_MODERATOR : AUSER_GET_COMMUNITY_MEMBERS, {
            variables: JSON.stringify({ communityId }),
            features: JSON.stringify({ "responsive_web_graphql_timeline_navigation_enabled": true })
        })
    }

    getNotificationTweet() {
        return this.get(AUSER_GET_NOTIFICATION_USER_FOLLOWED, {
            'include_profile_interstitial_type': '1',
            'include_blocking': '1',
            'include_blocked_by': '1',
            'include_followed_by': '1',
            'include_want_retweets': '1',
            'include_mute_edge': '1',
            'include_can_dm': '1',
            'include_can_media_tag': '1',
            'include_ext_has_nft_avatar': '1',
            'include_ext_is_blue_verified': '1',
            'include_ext_verified_type': '1',
            'include_ext_profile_image_shape': '1',
            'skip_status': '1',
            'cards_platform': 'Web-12',
            'include_cards': '1',
            'include_ext_alt_text': true,
            'include_ext_limited_action_results': true,
            'include_quote_count': true,
            'include_reply_count': '1',
            'tweet_mode': 'extended',
            'include_ext_views': true,
            'include_entities': true,
            'include_user_entities': true,
            'include_ext_media_color': true,
            'include_ext_media_availability': true,
            'include_ext_sensitive_media_warning': true,
            'include_ext_trusted_friends_metadata': true,
            'send_error_codes': true,
            'simple_quoted_tweet': true,
            'count': '50',
            'ext': 'mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl',
        })
    }

    NotificationAdd(user_id: string) {
        return this.UserNotificationsToggle(user_id, true)
    }

    NotificationRemove(user_id: string) {
        return this.UserNotificationsToggle(user_id, false)
    }

    private UserNotificationsToggle(user_id: string, device: boolean) {
        return this.post(AUSER_UPDATE_FRIEND, {
            params: {
                'include_profile_interstitial_type': '1',
                'include_blocking': '1',
                'include_blocked_by': '1',
                'include_followed_by': '1',
                'include_want_retweets': '1',
                'include_mute_edge': '1',
                'include_can_dm': '1',
                'include_can_media_tag': '1',
                'include_ext_has_nft_avatar': '1',
                'include_ext_is_blue_verified': '1',
                'include_ext_verified_type': '1',
                'include_ext_profile_image_shape': '1',
                'skip_status': '1',
                'cursor': '-1',
                'id': user_id,
                device,
            }
        })
    }

    async getLists() {
        const res = await this.get(AUSER_GET_LISTS, {
            variables: JSON.stringify({ "count": 100 }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
        return jsonpath.query(res, '$..list').map(x => new TwitterList(x))
    }

    async getList(listId: string) {
        const res = await this.get(AUSER_GET_LIST, {
            variables: JSON.stringify({ listId }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true
            })
        })
        return new TwitterList(jsonpath.query(res, '$..list')[0])
    }

    async getListMember(listId: string) {
        const res = await this.get(AUSER_GET_LIST_MEMBER, {
            variables: JSON.stringify({ listId, "count": 50, "withSafetyModeUserFields": true }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
        return jsonpath.query(res, '$..user_results.result').map(x => new TwitterUser(x))
    }

    async getListTweets(listId: string) {
        const res = await this.get(AUSER_GET_LIST_TWEETS, {
            variables: JSON.stringify({ listId, "count": 50 }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": false,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
        let array:TwitterTweet[] = []
        for (const result of jsonpath.query(res, '$..tweet_results.result')) {
            let tweet = new TwitterTweet('legacy' in result ? result : result.tweet)
            array.push(tweet)
        }
        return array
    }

    async ListCreate(name: string, description?: string, isPrivate = true) {
        const res = await this.post(AUSER_CREATE_LIST, {
            data: {
                variables: { name, description, isPrivate },
                features: {
                    'responsive_web_graphql_exclude_directive_enabled': true,
                    'verified_phone_label_enabled': false,
                    'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
                    'responsive_web_graphql_timeline_navigation_enabled': true,
                },
                'queryId': queryId(),
            }
        })

        return new TwitterList(jsonpath.query(res, '$..list') as any)
    }

    ListDelete(listId: string) {
        return this.post(AUSER_DELETE_LIST, {
            data: { variables: { listId }, 'queryId': queryId() }
        })
    }

    ListMemberAdd(listId: string, userId: string) {
        return this.post(AUSER_ADD_LIST_MEMBER, {
            data: {
                variables: { listId, userId, },
                features: {
                    'responsive_web_graphql_exclude_directive_enabled': true,
                    'verified_phone_label_enabled': false,
                    'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
                    'responsive_web_graphql_timeline_navigation_enabled': true,
                },
                'queryId': queryId(),
            }
        })
    }

    ListMemberRemove(listId: string, userId: string) {
        return this.post(AUSER_DELETE_LIST_MEMBER, {
            data: {
                variables: { listId, userId, },
                features: {
                    'responsive_web_graphql_exclude_directive_enabled': true,
                    'verified_phone_label_enabled': false,
                    'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
                    'responsive_web_graphql_timeline_navigation_enabled': true,
                },
                'queryId': queryId(),
            }
        })
    }
    /*
    aUser_settings() {
        return this.get(AUSER_SETTINGS, {
            'include_mention_filter': true,
            'include_nsfw_user_flag': true,
            'include_nsfw_admin_flag': true,
            'include_ranked_timeline': true,
            'include_alt_text_compose': true,
            'ext': 'ssoConnections',
            'include_country_code': true,
            'include_ext_dm_nsfw_media_filter': true,
            'include_ext_sharing_audiospaces_listening_data_with_followers': true,
        })
    }

    search_gifs(q: string) {
        return this.get(GIF_SEARCH, { q })
    }

    get_mutual_friend(userId: string) {
        return this.get(AUSER_GET_MUTUAL_FRIENDS, {
            variables: JSON.stringify({ userId, "count": 20, "includePromotedContent": false }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": true,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "rweb_video_timestamps_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }

    get_topic_landing_page(rest_id: string) {
        return this.get(TOPIC_LANDING, {
            variables: JSON.stringify({ rest_id, "context": "{}" }),
            features: JSON.stringify({
                "responsive_web_graphql_exclude_directive_enabled": true,
                "verified_phone_label_enabled": false,
                "responsive_web_graphql_timeline_navigation_enabled": true,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
                "creator_subscriptions_tweet_preview_api_enabled": true,
                "c9s_tweet_anatomy_moderator_badge_enabled": true,
                "tweetypie_unmention_optimization_enabled": true,
                "responsive_web_edit_tweet_api_enabled": true,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
                "view_counts_everywhere_api_enabled": true,
                "longform_notetweets_consumption_enabled": true,
                "responsive_web_twitter_article_tweet_consumption_enabled": true,
                "tweet_awards_web_tipping_enabled": false,
                "freedom_of_speech_not_reach_fetch_enabled": true,
                "standardized_nudges_misinfo": true,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
                "rweb_video_timestamps_enabled": true,
                "longform_notetweets_rich_text_read_enabled": true,
                "longform_notetweets_inline_media_enabled": true,
                "responsive_web_media_download_video_enabled": false,
                "responsive_web_enhance_cards_enabled": false
            })
        })
    }
    */
}

export const twitterApi = new TwitterApi()