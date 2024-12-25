import { client, getHtmlRoot, Origin, ParseActions, lang, setLanguage } from './Api';
import { Message } from './models';
import { setTimeout } from 'timers/promises';
export { setLanguage } from './Api';

export async function LiveChatMessage(YouTubeURLorID: string, handler: (message: Message) => any) {

    var videoID = await getLatestStreamingVideoID(YouTubeURLorID) || getYouTubeVideoID(YouTubeURLorID)

    var liveRes = (await client.get(`https://www.youtube.com/watch?v=${videoID}`)).data
    if (liveRes.match(/LIVE_STREAM_OFFLINE/)) return

    var key = liveRes.match(/"INNERTUBE_API_KEY":"(\S*?)"/)![1] as string
    var continuation = liveRes.match(/"continuation":"(\S*?)"/)![1] as string
    var clientName = liveRes.match(/"clientName":"(\S*?)"/)![1] as string
    var clientVersion = liveRes.match(/"clientVersion":"(\S*?)"/)![1] as string
    var time = 0
    while (true) {
        const data = (await client.post(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${key}`,
            {
                context: {
                    client: {
                        clientName,
                        clientVersion,
                        gl: lang.Region.gl,
                        hl: lang.Region.hl
                    }
                }, continuation
            })).data

        for (const element of ParseActions(data)) {
            if (element.timestampUsec < time) continue
            time = element.timestampUsec
            handler(element)
        }

        await setTimeout(3000)
    }

}

export function getYouTubeVideoID(url: string) {
    var videoID = url.replace(/(?:(http|https):\/\/(?:www\.)?youtu\.?be(?:\.com)?\/(?:embed\/|watch\?v=|\?v=|v\/|e\/|[^\[]+\/|watch.*v=)?)/, "");

    if (videoID.includes("&")) {
        var tempArray = videoID.split("&");
        videoID = tempArray[0];
    }
    if (videoID?.length == 11)
        return videoID;
}

export async function getLatestStreamingVideoID(channelIDorUrl: string) {
    let videoID = "";
    const channelID = await getYouTubeChannelID(channelIDorUrl)
    const root = await getHtmlRoot(`${Origin}/channel/${channelID}/live`);
    if (!root) return
    const linkElements = root.querySelectorAll("link");

    for (const element of linkElements) {
        // 找到 rel="canonical" 的 <link> 標籤
        if (element.getAttribute("rel") === "canonical") {
            const hrefStr = element.getAttribute("href") || "";

            // 使用正則表達式匹配影片 ID
            const regexVideoID = /(?:v=|\/)([0-9A-Za-z_-]{11})/g;
            const matches = [...hrefStr.matchAll(regexVideoID)];

            if (matches.length > 0 && matches[0][1]) {
                videoID = matches[0][1]; // 提取影片 ID
                break;
            }
        }
    }

    return videoID;
}

export async function getYouTubeChannelID(channelUrl: string) {
    if (channelUrl.includes(`${Origin}/channel/`))
        return channelUrl.replace(`${Origin}/channel/`, "");

    if (channelUrl.includes(`${Origin}/c/`) || channelUrl.includes(`${Origin}/user/`) || channelUrl.includes(`${Origin}/@`))
        
        return await parseYouTubeChannelID(channelUrl);

    return channelUrl;
}

export async function parseYouTubeChannelID(channelUrl: string) {
    // 使用 node-html-parser 解析 HTML
    const root = await getHtmlRoot(channelUrl);

    // 查找 meta 標籤，其屬性 property 為 "og:url"
    const metaElement = root.querySelector('meta[property="og:url"]');

    if (metaElement) {
        // 獲取 content 屬性值
        channelUrl = metaElement.getAttribute("content") || "";
    }

    if (channelUrl) {
        // 移除前綴部分
        const origin = "https://www.youtube.com";
        channelUrl = channelUrl.replace(`${origin}/channel/`, "");
    }

    return channelUrl;
}