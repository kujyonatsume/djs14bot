import { Entity, Column, IdxEntity, ManyToOne } from "./Entity"
import { TwitterUser } from "./TwitterUser"


@Entity()
export class TwitterNotify extends IdxEntity {

    @Column({ nullable: false })
    guildId: string

    @Column({ nullable: false })
    channelId: string

    @Column({ nullable: false, default: "" })
    text: string

    @ManyToOne(() => TwitterUser, x => x.notifys)
    target: Promise<TwitterUser>

    @Column({ nullable: false })
    targetId: string

    @Column({ nullable: false, default: `["發佈", "引用"]` })
    type: string

    get Text() {
        return this.text == "" ? null : this.text
    }

}
