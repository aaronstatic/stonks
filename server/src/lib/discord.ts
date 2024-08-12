// Require the necessary discord.js classes
import { APIEmbed, Channel, Client, EmbedBuilder, GatewayIntentBits, TextChannel } from 'discord.js';

import { WebSocket, WebSocketServer } from 'ws';

interface ChannelMap {
    [key: string]: string;
}

const channels: ChannelMap = {
    "test": "1242724156014067804",
    "macro": "1230179012387668128",
    "dev": "1240643365574279239"
}

interface Packet {
    cmd: string,
    channel: string,
    message?: string,
    image?: string,
    embed?: {
        title: string,
        description: string,
        fields: {
            name: string,
            value: string
        }[]
    }
}

export class DiscordBot {
    constructor() {
        console.log("Starting discord bot");

        // Create a new discord client instance
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });

        const wss = new WebSocketServer({ port: 9090 });
        wss.on('connection', function connection(ws) {
            console.log("Websocket client connected");
            ws.on('error', console.error);

            ws.on('message', async function message(data) {
                if (data.toString().startsWith("{")) {
                    const packet = JSON.parse(data.toString()) as Packet;
                    console.log(packet);

                    let channel: Channel | undefined = client.channels.cache.get(channels[packet.channel]) as TextChannel;
                    if (!channel) {
                        //try and fetch archived thread                        
                        const parentChannel = client.channels.cache.get(channels["dev"]) as TextChannel;
                        if (!parentChannel) {
                            console.error("Dev channel not found");
                            return;
                        }
                        await parentChannel.threads.fetchArchived().then(() => {
                            channel = client.channels.cache.get(channels[packet.channel]) as TextChannel;
                        });
                        if (!channel) {
                            console.error("Channel not found");
                            return;
                        }
                    }

                    if (packet.cmd === "msg" && packet.message) {
                        channel.send(packet.message);
                    }

                    if (packet.cmd === "embed" && packet.embed) {
                        const embed = new EmbedBuilder();
                        embed.setTitle(packet.embed.title);
                        embed.setDescription(packet.embed.description);
                        embed.addFields(...packet.embed.fields);
                        channel.send({
                            embeds: [embed]
                        });
                    }

                    if (packet.cmd === "img" && packet.image) {
                        if (packet.message) {
                            channel.send({
                                content: packet.message,
                                files: [packet.image]
                            });
                        } else {
                            channel.send({
                                files: [packet.image]
                            });
                        }
                    }
                }
            });
        });

        client.login(process.env.DISCORD_BOT_TOKEN);
    }
}


async function getPage(channel: string, beforeId: number) {
    let before = "";
    if (beforeId !== 0) {
        before = "&before=" + beforeId;
    }
    let headers: HeadersInit = {};
    if (process.env.DISCORD_API_KEY) {
        headers.authorization = process.env.DISCORD_API_KEY;
    }
    let data = await fetch(
        `https://discord.com/api/v9/channels/${channel}/messages?limit=100` + before,
        {
            method: "GET",
            headers: headers
        }
    )
        .then((response) => response.json())
        .catch((err) => {
            console.error(err);
        });
    return data;
}

export const getMessages = async (channel: string, pages: number = 3) => {
    //console.log("Fetching page 0");
    let messages = await getPage(channel, 0);
    for (let t = 0; t < pages - 1; t++) {
        const id = messages[messages.length - 1].id;
        if (!id) break;
        //console.log("Fetching page " + (t + 1));
        const page = await getPage(channel, id);
        messages.push(...page);
    }

    return messages;
}

export const getChannelHistory = async (channelId: string, pages: number = 3): Promise<string> => {
    const messages = await getMessages(channelId, pages);
    let txt = "";
    messages.reverse();
    for (const msg of messages) {
        if (!msg.content) continue;
        if (msg.content.startsWith("http")) continue;
        if (msg.content == "") continue;
        if (msg.content.startsWith("<:")) continue;
        if (msg.content.startsWith("<@")) continue;
        txt += msg.author.username + ": " + msg.content + "\n";
    }
    return txt;
}

export async function sendToDiscord(packet: Packet): Promise<boolean> {
    //console.log("Sending packet to discord");
    //console.log(packet);

    const ws = new WebSocket('ws://localhost:9090');

    return new Promise<boolean>((resolve, reject) => {
        ws.on('open', function open() {
            ws.send(JSON.stringify(packet));
            ws.close();
            resolve(true);
        });

        ws.on('error', function error(err) {
            console.error("WebSocket error:", err);
            reject(false);
        });
    });
}
