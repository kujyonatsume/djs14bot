import { AttachmentBuilder, Client, codeBlock, Collection, EmbedBuilder, inlineCode, Interaction, Routes, TextChannel } from "discord.js";
import * as AppModule from "./Commands";
import { commands, IOption, count, OptionAnd, Module } from "./decorator";
import { db } from "../db";

const modules = new Collection<string, Module>()

export const client = new Client({ intents: 3276799 })

export async function DiscordStart(token: string, guildId?: string) {

    client.on("ready", async c => {
        for (const [key, Mod] of Object.entries(AppModule)) {
            const mod = new Mod(c)
            modules.set(key.toLowerCase(), mod)
            await mod.init()
        }
        console.log(`${c.user.username} 初始化完成`)
        let size = (await c.application.commands.set((commands as any).filter((x: { only: any; }) => !x.only))).size
        if (c.guilds.cache.has(guildId))
            size += (await c.application.commands.set((commands as any).filter((x: { only: any; }) => x.only), guildId)).size
        console.log(`已註冊 ${size} 個模組 總共 ${count} 個指令`)

        c.on("messageCreate", async message => {
            try {
                if (message.guild.id != guildId || message.author.id != "386473957806833664") return
                var line = message.content.trim()
                if (!line.startsWith("x!")) return
                var args = line.slice(2).split(" ")
                if (args[0] == "guilds") {
                    var s = ""
                    for (const [_, guild] of c.guilds.cache) {
                        const m = await guild.fetchOwner()
                        s += `${guild.name}(${guild.id}) ${m.user} ${m.user.displayName}\n`
                    }
                    await message.channel.send(s)
                    return
                }

                else if (args[0] == "alluser") {
                    var users = await db.TwitterUser.find()
                    message.channel.send({
                        embeds: [new EmbedBuilder()
                            .setDescription(users.map(user => user.url).join("\n"))
                            .setColor('Aqua')
                        ]
                    })
                }

                else if (args[0] == "notifys") {
                    const n = await db.TwitterNotify.find()
                    message.channel.send({
                        embeds: [new EmbedBuilder().setDescription(
                            n.map(x => `${x.guildId} ${x.channelId} ${inlineCode(x.Text)}`).join("\n")
                        )]
                    })
                }

                else if (args[0] == "getrole") {
                    var txt = ""
                    for (const [_, role] of c.guilds.cache.get(args[1]).roles.cache) {
                        if (role.id == args[2]){
                            message.channel.send({ embeds: [new EmbedBuilder().setDescription(role.id)] })
                            return 
                        }
                        txt += `${role.name} ${role.id}\n`
                    }
                    message.channel.send({ embeds: [new EmbedBuilder().setDescription(txt)] })
                }

                else if (args[0] == "setnotify") {
                    const n = await db.TwitterNotify.findOneBy({ channelId: args[1] })
                    n.text = args[2] ?? ""
                    await n.save()
                    message.channel.send(codeBlock("json", JSON.stringify(n, null, 2)))
                }

                else if (args[0] == "send") {
                    message.channel.send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
                            .setTitle(`來自開發者的訊息`)
                            .setDescription(args.slice(1).join(" "))
                            .setColor('Aqua')
                        ]
                    })
                }

                else if (args[0] == "sendall") {
                    let g = []
                    for (const n of await db.TwitterNotify.find()) {
                        if (g.includes(n.guildId)) continue
                        var ch = c.channels.cache.get(n.channelId)
                        if ('send' in ch) {
                            await ch.send({
                                embeds: [new EmbedBuilder()
                                    .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
                                    .setTitle(`來自開發者的訊息`)
                                    .setDescription(args.slice(1).join(" "))
                                    .setColor('Aqua')
                                ]
                            })
                        }
                        if ('name' in ch && 'guild' in ch)
                            message.channel.send(`${ch.guild.name} ${ch.name} OK`)
                        g.push(n.guildId)
                    }
                }
            } catch (e) { console.log(e); }

        })

        c.on("interactionCreate", async interaction => {

            if (interaction.isAutocomplete()) {
                const { module, subOptions } = await isCommand(interaction)
                const data = (interaction.options as any).getFocused(true)
                const options = await subOptions.find(x => x.name === data.name).exec(module, interaction, data.value)
                await interaction.respond(options)
                return
            }

            if (interaction.isChatInputCommand()) {
                const { module, command, subOptions } = await isCommand(interaction)
                try {
                    let line = `${interaction.user.displayName} ${command.orgName}`
                    console.log()
                    console.log(`\n${new Date().toLocaleTimeString()}[command start] ${interaction.commandName} ${line}`);

                    module.setInter(interaction)
                    let options = subOptions.map((x => {
                        let d = interaction.options.get(x.name);
                        return x.name, d ? d[x.parse] || d.value : null
                    }))

                    console.log(`${interaction.commandName} ${options.join(" ")}`);

                    await module[command.orgName](...options)
                    console.log(`[command end]  ${interaction.commandName} ${line}`);
                } catch (e) { console.log(e); }
            }
        })

        async function isCommand(interaction: Interaction) {
            if (interaction.isAutocomplete() || interaction.isChatInputCommand()) {

                let command = commands.find(x => x.name === interaction.commandName) as OptionAnd
                const sub = interaction.options.getSubcommand(false)
                if (sub) {
                    const group = interaction.options.getSubcommandGroup(false)
                    if (group)
                        command = (<any>command.options as IOption[]).find(x => x.name == group) as OptionAnd
                    command = (<any>command.options as IOption[]).find(x => x.name == sub) as OptionAnd
                }
                return {
                    subOptions: (<any>command.options as IOption[]),
                    module: modules.get(interaction.commandName),
                    command
                }
            }
        }
        c.on("guildCreate", async guild => {
            try {
                console.log("加入伺服器: " + guild.name)
            } catch (e) {
                console.log(e);
            }
        })

    })
    await client.login(token)
}
