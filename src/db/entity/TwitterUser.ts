import { Entity, Column, OneToMany, IdxEntity } from "./Entity"
import { TwitterNotify } from "./TwitterNotify"

@Entity()
export class TwitterUser extends IdxEntity {

    @Column({ unique: true })
    id: string

    @Column({ nullable: false })
    name: string

    @Column({ nullable: false })
    screen_name: string

    @Column({ nullable: false })
    icon: string

    @Column({ nullable: false, default: "0" })
    last_tweet: string

    @OneToMany(() => TwitterNotify, x => x.target, { eager: true })
    notifys: TwitterNotify[]

    @Column({ nullable: false, default:true })
    enabled: Boolean
    static async findUser(screen_name: string) {
        return this.findOneBy({ screen_name })
    }
    static async findId(id: string) {
        return this.findOneBy({ id })
    }

    get url() {
        return `https://x.com/${this.screen_name}`
    }
}
