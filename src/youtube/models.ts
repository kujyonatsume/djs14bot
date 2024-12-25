export class RegionData {
    public readonly value: string
    constructor(public gl = "US", public hl = "en", public timeZone = "America/Los_Angeles", public AcceptLanguage = "en-US;q=0.9,en-GB;q=0.8,en;q=0.7") { }
}

export class Message {
    /** 類型 */
    type?: string;
    /** 使用者頻道ID */
    channelID?: string;
    /** 使用者名稱 */
    name?: string;
    /** 使用者相片影像檔網址 */
    avatarUrl?: string;
    /** 使用者徽章（文字） */
    authorBadges?: string;
    /** 訊息內容 */
    content?: string;
    /** 購買金額（文字格式） */
    purchaseAmountText?: string;
    /** 前景顏色（Hex 色碼） */
    foregroundColor?: string;
    /** 背景顏色（Hex 色碼） */
    backgroundColor?: string;
    /** 時間標記（Unix 秒數） */
    timestampUsec?: number;
    /** 時間標記（文字格式）*/
    timestampText?: string;
    /** 列表：Sticker 資料 */
    stickers?: StickerData[];
    /** Emoji 資料 */
    emojis?: EmojiData[];
    /** 徽章資料 */
    badges?: BadgeData[];
}

export class AuthorBadgesData {
    /** 文字 */
    text?: string;
    /** 列表：徽章資料 */
    badges?: BadgeData[];
}

export class BadgeData {
    /** 工具提示 */
    tooltip?: string;
    /** 標籤 */
    label?: string;
    /** 圖示類型 */
    iconType?: string;
    /** 影像檔的網址 */
    url?: string;
}

export class EmojiData {
    /** Emoji 的 ID 值*/
    id?: string;
    /** 影像檔的網址*/
    url?: string;
    /** 文字 */
    text?: string;
    /**標籤 */
    label?: string;
    /** 是否為自定義表情符號 */
    isCustomEmoji: boolean = false
}

export class MessageData {
    /** 文字 */
    text?: string;
    /** 是否為粗體 */
    bold?: boolean;
    /** 文字顏色 */
    textColor?: string;
    /** 字型 */
    fontFace?: string;
    /** Sticker 資料 */
    stickers?: StickerData[];
    /** Emoji 資料 */
    emojis?: EmojiData[];
}

export class StickerData {
    /** Sticker 的 ID 值 */
    id?: string;
    /** 影像檔的網址 */
    url?: string;
    /** 文字 */
    text?: string;
    /** 標籤 */
    label?: string;
}

export class RunsData {
    /** 文字 */
    text?: string;
    /** 是否為粗體 */
    bold?: boolean;
    /** 文字顏色 */
    textColor?: string;
    /** 字型 */
    fontFace?: string;
    /** 列表：Emoji 資料 */
    emojis?: EmojiData[];
    /** 網址 */
    url?: string;
    /** 是否為連結 */
    isLink: boolean = false;
}

export const Localize = {
    en: {
        ChatGeneral: "General",
        ChatSuperChat: "Super Chat",
        ChatSuperSticker: "Super Sticker",
        ChatJoinMember: "Join Member",
        ChatMemberUpgrade: "Member Upgrade",
        ChatMemberMilestone: "Member Milestone",
        ChatMemberGift: "Member Gift",
        ChatReceivedMemberGift: "Received Member Gift",
        ChatRedirect: "Redirect",
        ChatPinned: "Pinned",
        MemberUpgrade: "Upgraded membership to",
        MemberMilestone: "Member for",
        Region: new RegionData("US", "en", "America/New_York", "en-US,en;q=0.9")
    },
    zh: {
        ChatGeneral: "一般",
        ChatSuperChat: "超級留言",
        ChatSuperSticker: "超級貼圖",
        ChatJoinMember: "加入會員",
        ChatMemberUpgrade: "會員升級",
        ChatMemberMilestone: "會員里程碑",
        ChatMemberGift: "贈送會員",
        ChatReceivedMemberGift: "接收會員贈送",
        ChatRedirect: "重新導向",
        ChatPinned: "置頂留言",
        MemberUpgrade: "頻道會員等級已升級至",
        MemberMilestone: "已加入會員",
        Region: new RegionData("TW", "zh-TW", "Asia/Taipei", "zh-TW,zh;q=0.9,en-US;q=0.8,en-GB;q=0.7,en;q=0.6")
    },
    jp: {
        ChatGeneral: "一般",
        ChatSuperChat: "スーパーチャット",
        ChatSuperSticker: "スーパーステッカー",
        ChatJoinMember: "メンバー登録",
        ChatMemberUpgrade: "会員アップグレード",
        ChatMemberMilestone: "会員マイルストーン",
        ChatMemberGift: "会員ギフト",
        ChatReceivedMemberGift: "会員プレゼントを受け取る",
        ChatRedirect: "リダイレクト",
        ChatPinned: "ピン留め",
        MemberUpgrade: "にアップグレードされました",
        MemberMilestone: "メンバー歴",
        Region: new RegionData("JP", "ja", "Asia/Tokyo", "ja-JP,ja;q=0.9,en-US;q=0.8,en-GB;q=0.7,en;q=0.6")
    },
    kr: {
        ChatGeneral: "일반",
        ChatSuperChat: "슈퍼 채팅",
        ChatSuperSticker: "슈퍼 스티커",
        ChatJoinMember: "회원 가입",
        ChatMemberUpgrade: "회원 업그레이드",
        ChatMemberMilestone: "회원 마일스톤",
        ChatMemberGift: "회원 선물",
        ChatReceivedMemberGift: "회원 선물 받기",
        ChatRedirect: "리디렉션",
        ChatPinned: "고정",
        MemberUpgrade: "멤버십을",
        MemberMilestone: "회원 가입 기간",
        Region: new RegionData("KR", "ko", "Asia/Seoul", "ko-KR,ko;q=0.9,en-US;q=0.8,en-GB;q=0.7,en;q=0.6")
    }
};
