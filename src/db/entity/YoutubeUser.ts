import { Entity, Column, OneToMany, IdxEntity } from "./Entity"
import { YoutubeNotify } from "./YoutubeNotify"


@Entity()
export class YoutubeUser extends IdxEntity {

    @Column({ unique: true })
    id: string

    @Column({ nullable: false })
    handle: string

    @Column({ nullable: false })
    name: string
    
    @Column({ nullable: false })
    icon: string

    @Column({ nullable: false, default: "0" })
    last_video: string

    @OneToMany(() => YoutubeNotify, x => x.target, { eager: true })
    notifys: YoutubeNotify[]

    static async findUser(handle: string) {
        return this.findOneBy({ handle })
    }
    static async findId(id: string) {
        return this.findOneBy({ id })
    }

    get url() {
        return `https://www.youtube.com/@${this.handle}`
    }
}