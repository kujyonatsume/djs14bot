import './global-addon'
import { DatabaseInit } from './db';
import { DiscordStart } from './discord';
import { twitterApi } from './twitter';
import config from "./config"

Main()
async function Main() {
    twitterApi.setCookie(config.twitter)
    await DatabaseInit();
    await DiscordStart(config.token, config.guildId);
}

