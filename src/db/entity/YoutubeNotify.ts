import { Entity, Column, IdxEntity, ManyToOne } from "./Entity"
import { YoutubeUser } from "./YoutubeUser"


@Entity()
export class YoutubeNotify extends IdxEntity {

    @Column({ nullable: false })
    guildId: string

    @Column({ nullable: false })
    channelId: string

    @Column({ nullable: false, default: "" })
    text: string

    @ManyToOne(() => YoutubeUser, x => x.notifys)
    target: Promise<YoutubeUser>

    @Column({ nullable: false })
    targetId: string

    @Column({ nullable: false, default: `["發佈", "引用"]` })
    type: string

    get Text() {
        return this.text == "" ? null : this.text
    }
}
