import axios, { AxiosInstance } from 'axios';
import htmlParse from 'node-html-parser';
import { AuthorBadgesData, BadgeData, EmojiData, Localize, MessageData, Message, RunsData, StickerData } from './models';
export { Localize } from './models';
export const YouTube = "YouTube";
export const Origin = "https://www.youtube.com";

export var lang: typeof Localize[keyof typeof Localize]

export var client: AxiosInstance = setLanguage("zh");

export function setLanguage(key: keyof typeof Localize) {
    lang = Localize[key]
    return client = axios.create({
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Sec-CH-Prefers-Reduced-Motion": "",
            "Sec-CH-UA": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            "Sec-CH-UA-Arch": "",
            "Sec-CH-UA-Bitness": "",
            "Sec-CH-UA-Full-Version-List": "",
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Model": "",
            "Sec-CH-UA-Platform": "Windows",
            "Sec-CH-UA-Platform-Version": "",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "same-origin",
            "Sec-Fetch-Dest": "empty",
            "Origin": Origin,
            "X-Origin": Origin,
            'Accept-Language': lang.Region.AcceptLanguage
        }
    });
}

export async function getHtmlRoot(url: string) {
    console.log(url);
    
    var res = await client.get(url)

    if (res.status != 200) {
        console.error(`連線發生錯誤(${res.status})`)
        return
    }

    return htmlParse(res.data);
}

export function ParseActions(jsonElement: any) {
    const output: Message[] = [];

    if (jsonElement) {
        let actions = jsonElement?.continuationContents?.liveChatContinuation?.actions;

        if (!actions) {
            actions = jsonElement?.contents?.liveChatRenderer?.actions;
        }

        if (Array.isArray(actions)) {
            for (const singleAction of actions) {

                // Handle `addChatItemAction`.
                const item = singleAction?.addChatItemAction?.item;
                if (item) output.push(...parseRenderer(item));

                // Handle `addBannerToLiveChatCommand`.
                const singleBannerRenderer = singleAction?.addBannerToLiveChatCommand?.bannerRenderer;
                if (singleBannerRenderer) output.push(...parseRenderer(singleBannerRenderer));

                // Handle `videoOffsetTimeMsec`.
                const videoOffsetTimeMsec = singleAction?.addChatItemAction?.videoOffsetTimeMsec;
                const videoOffsetTimeText = getVideoOffsetTimeMsec(videoOffsetTimeMsec);

                // Handle `replayChatItemAction`.
                const replayActions = singleAction?.replayChatItemAction?.actions;

                if (Array.isArray(replayActions)) {
                    for (const replayAction of replayActions) {
                        const replayItem = replayAction?.addChatItemAction?.item;

                        if (replayItem) {
                            const rendererDatas = parseRenderer(replayItem);

                            rendererDatas.forEach((rendererData) => {
                                if (!rendererData.timestampText && !rendererData.timestampUsec) {
                                    rendererData.timestampText = videoOffsetTimeText;
                                }
                            });

                            output.push(...rendererDatas);
                        }

                        const replayBannerRenderer = replayAction?.addBannerToLiveChatCommand?.bannerRenderer;

                        if (replayBannerRenderer) {
                            const rendererDatas = parseRenderer(replayBannerRenderer);

                            rendererDatas.forEach((rendererData) => {
                                if (!rendererData.timestampText && !rendererData.timestampUsec) {
                                    rendererData.timestampText = videoOffsetTimeText;
                                }
                            });

                            output.push(...rendererDatas);
                        }
                    }
                }
            }
        }
    }

    return output.filter(x => x.type);
}

export function ParseContinuation(jsonElement: any) {
    var continuations = jsonElement?.continuationContents?.liveChatContinuation?.continuations
    if (continuations) for (var singleContinuation of continuations) {
        let timeoutMs = singleContinuation?.invalidationContinuationData?.timeoutMs ||
            singleContinuation?.timedContinuationData?.timeoutMs ||
            singleContinuation?.liveChatReplayContinuationData?.timeUntilLastMessageMsec
        if (timeoutMs) return `${timeoutMs}`
    }
}

function getVideoOffsetTimeMsec(jsonElement?: any) {
    const videoOffsetTimeMsec = jsonElement?.videoOffsetTimeMsec;

    if (!videoOffsetTimeMsec) return
    const milliseconds = Number(videoOffsetTimeMsec);

    // 將 Unix 毫秒時間轉換為 "HH:mm:ss" 格式
    const date = new Date(milliseconds);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

function parseRenderer(jsonElement?: any) {
    const output: Message[] = [];

    if ((
        setRendererData(output, jsonElement, "liveChatTextMessageRenderer") ||
        setRendererData(output, jsonElement, "liveChatPaidMessageRenderer") ||
        setRendererData(output, jsonElement, "liveChatPaidStickerRenderer") ||
        setRendererData(output, jsonElement, "liveChatMembershipItemRenderer") ||
        setRendererData(output, jsonElement, "liveChatViewerEngagementMessageRenderer") ||
        setRendererData(output, jsonElement, "liveChatModeChangeMessageRenderer") ||
        setRendererData(output, jsonElement, "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer") ||
        setRendererData(output, jsonElement, "liveChatSponsorshipsGiftRedemptionAnnouncementRenderer")
    )) return output

    const liveChatBannerRenderer = jsonElement?.liveChatBannerRenderer;

    if (setRendererData(output, liveChatBannerRenderer?.header, "liveChatBannerHeaderRenderer")) return output

    const contents = liveChatBannerRenderer?.contents;

    setRendererData(output, contents, "liveChatTextMessageRenderer") || setRendererData(output, contents, "liveChatBannerRedirectRenderer")

    return output;
}

function getRendererDataType(rendererName: string) {
    return ({
        "liveChatTextMessageRenderer": lang.ChatGeneral,
        "liveChatPaidMessageRenderer": lang.ChatSuperChat,
        "liveChatPaidStickerRenderer": lang.ChatSuperSticker,
        "liveChatMembershipItemRenderer": lang.ChatJoinMember,
        "liveChatViewerEngagementMessageRenderer": YouTube,
        "liveChatModeChangeMessageRenderer": YouTube,
        "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer": lang.ChatMemberGift,
        "liveChatSponsorshipsGiftRedemptionAnnouncementRenderer": lang.ChatReceivedMemberGift,
        "liveChatBannerHeaderRenderer": lang.ChatPinned,
        "liveChatBannerRedirectRenderer": lang.ChatRedirect,
    }[rendererName])
}

function getAuthorName(jsonElement?: any): string {
    return jsonElement?.authorName?.simpleText;
}

function getAuthorPhoto(jsonElement?: any) {
    return getThumbnailUrl(jsonElement?.authorPhoto);
}

function setRendererData(dataSet: Message[], jsonElement: any, rendererName: string) {
    if (!(jsonElement = jsonElement?.[rendererName])) return false
    let data = new Message()
    const messageData = parseMessageData(jsonElement);
    data.type = getRendererDataType(rendererName);
    data.channelID = jsonElement?.authorExternalChannelId;
    data.name = getAuthorName(jsonElement);
    data.avatarUrl = getAuthorPhoto(jsonElement);
    data.authorBadges = parseAuthorBadges(jsonElement)?.text;
    data.content = messageData?.text;
    data.purchaseAmountText = jsonElement?.purchaseAmountText?.simpleText;
    data.foregroundColor = messageData?.textColor;
    data.backgroundColor = getColorHexCode(jsonElement?.backgroundColor ?? jsonElement?.bodyBackgroundColor)
    data.timestampUsec = Number(jsonElement?.timestampUsec)
    if (data.timestampUsec) data.timestampText = new Date(data.timestampUsec / 1000).toLocaleString(lang.Region.value)


    // Handle special cases
    if (data.type === "YouTube") data.name = "[YouTube]";

    if (rendererName === "liveChatMembershipItemRenderer") {
        // Update type based on message content
        if (data.content.includes(lang.MemberUpgrade)) {
            data.type = lang.ChatMemberUpgrade;
        } else if (data.content.includes(lang.MemberMilestone)) {
            data.type = lang.ChatMemberMilestone;
        }
    } else if (rendererName === "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer") {
        const headerRenderer = jsonElement.header?.liveChatSponsorshipsHeaderRenderer;

        if (headerRenderer) {
            data.name = getAuthorName(headerRenderer);
            data.avatarUrl = getAuthorPhoto(headerRenderer);
            data.authorBadges = parseAuthorBadges(headerRenderer)?.text;
            data.content = parseMessageData(headerRenderer)?.text;
        }
    }

    dataSet.push(data)
    return true
}

function parseAuthorBadges(jsonElement: any) {
    const authorBadges = jsonElement?.authorBadges;
    if (!Array.isArray(authorBadges)) return
    const output = new AuthorBadgesData()
    const tempBadges: BadgeData[] = [];
    for (const singleAuthorBadge of authorBadges) {
        const badgeData = new BadgeData()
        badgeData.url = getThumbnailUrl(singleAuthorBadge?.liveChatAuthorBadgeRenderer?.customThumbnail);
        badgeData.iconType = singleAuthorBadge?.liveChatAuthorBadgeRenderer?.icon?.iconType;
        badgeData.tooltip = singleAuthorBadge?.liveChatAuthorBadgeRenderer?.tooltip;
        badgeData.label = singleAuthorBadge?.liveChatAuthorBadgeRenderer?.accessibility?.accessibilityData?.label;
        tempBadges.push(badgeData);
    }
    output.text = getBadgeName(tempBadges);
    output.badges = tempBadges;
    return output;
}

function getBadgeName(list: BadgeData[]) {
    var array = list.map(n => n.label);
    if (Array.isArray(array)) return array.join("、");
}

function parseMessageData(jsonElement: any) {
    const output = new MessageData()
    let tempText = '';
    let tempTextColor = '';
    let tempFontFace = '';
    let isBold = false;
    const tempStickers: StickerData[] = [];
    const tempEmojis: EmojiData[] = [];

    function addRunData(runsData?: RunsData) {
        if (!runsData) return;
        tempText += runsData.text || '';
        isBold = runsData.bold || false;
        tempTextColor = runsData.textColor || '';
        tempFontFace = runsData.fontFace || '';
        if (runsData.emojis) tempEmojis.push(...runsData.emojis);
    };

    const headerPrimaryText = jsonElement?.headerPrimaryText;
    if (headerPrimaryText) {
        const runsData = parseRunData(headerPrimaryText);
        tempText += ` [${runsData.text}] `;
        addRunData(runsData);
    }

    const headerSubtext = jsonElement?.headerSubtext;
    if (headerSubtext) {
        const simpleText = headerSubtext?.simpleText;
        if (simpleText) tempText += ` [${simpleText}] `;
        const runsData = parseRunData(headerSubtext);
        tempText += ` ${runsData.text} `;
        addRunData(runsData);
    }

    addRunData(parseRunData(jsonElement?.primaryText));
    addRunData(parseRunData(jsonElement?.text));
    addRunData(parseRunData(jsonElement?.subtext));

    const sticker = jsonElement?.sticker;
    if (sticker) {
        const stickerData = new StickerData()
        const label = sticker?.accessibility?.accessibilityData?.label;
        if (label) tempText += `:${label}:`;
        const content = jsonElement?.lowerBumper?.liveChatItemBumperViewModel?.content?.bumperUserEduContentViewModel?.text?.content;
        if (content) tempText += ` [${content}] `;
        stickerData.id = label || '';
        stickerData.url = getThumbnailUrl(sticker);
        stickerData.text = label ? `:${label}:` : '';
        stickerData.label = label || '';
        tempStickers.push(stickerData);
    }

    const purchaseAmountText = jsonElement?.purchaseAmountText?.simpleText;
    if (purchaseAmountText) tempText += ` [${purchaseAmountText}] `;

    addRunData(parseRunData(jsonElement?.message));
    addRunData(parseRunData(jsonElement?.bannerMessage));

    output.text = tempText;
    output.bold = isBold;
    output.textColor = tempTextColor;
    output.fontFace = tempFontFace;
    output.stickers = tempStickers;
    output.emojis = tempEmojis;

    return output;
}

function parseRunData(jsonElement: any) {
    const runs = jsonElement?.runs;
    if (!Array.isArray(runs)) return
    const output = new RunsData();
    let tempText = '';
    let tempTextColor = '';
    let tempFontFace = '';
    let isBold = false;
    const tempEmojis: EmojiData[] = [];

    for (const singleRun of runs) {
        const text = singleRun?.text;
        if (text) tempText += text;
        const bold = singleRun?.bold;
        if (bold) isBold = bold;
        const textColor = singleRun?.textColor;
        if (textColor) tempTextColor += getColorHexCode(textColor);
        const fontFace = singleRun?.fontFace;
        if (fontFace) tempFontFace += fontFace;
        const emoji = singleRun?.emoji;
        if (emoji) {
            const emojiData = new EmojiData()
            const emojiId = emoji?.emojiId;
            if (emojiId) emojiData.id = emojiId;
            emojiData.url = getThumbnailUrl(emoji?.image);
            const label = emoji?.image?.accessibility?.accessibilityData?.label;
            if (label) tempText += `:${label}:`;
            const shortcuts = emoji?.shortcuts;
            if (shortcuts?.length) emojiData.text = shortcuts[0];
            emojiData.label = label || '';
            emojiData.isCustomEmoji = emoji?.isCustomEmoji || false;
            tempEmojis.push(emojiData);
        }
    }

    output.text = tempText;
    output.bold = isBold;
    output.textColor = tempTextColor;
    output.fontFace = tempFontFace;
    output.emojis = tempEmojis;


    return output;
}

function getThumbnailUrl(jsonElement?: any) {
    const thumbnails = jsonElement?.thumbnails;
    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
        const url = thumbnails[thumbnails.length == 1 ? 0 : 1]?.url.split('=')[0]
        if (url?.startsWith('//')) return `https:${url}`;
        return url
    }
}

function getColorHexCode(color?: number) {
    if (color) return `#${color.toString(16).padStart(6, '0')}`;
}

