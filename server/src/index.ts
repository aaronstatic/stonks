import http from "http";
import { WebSocketServer } from "ws";
import 'dotenv/config';
import https from "https";

import getObjects from "./api/get-objects";
import createObject from "./api/create-object";
import updateObject from "./api/update-object";
import deleteObject from "./api/delete-object";
import getObject from "./api/get-object";
import queryObjects from "./api/query-objects";
import getReport from "./api/get-report";
import queryDatabase from "./api/query-database";

import { DiscordBot } from "./lib/discord";
import addTrade from "./api/add-trade";

import db from "./lib/mongo";
import { ObjectId } from "mongodb";

const discord = new DiscordBot();

const server = https.createServer({
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT
});

const devServer = http.createServer();

//check if running in dev

if (process.env.NODE_ENV === "development") {
    devServer.listen(9334, () => {
        console.log("Dev server started on port 9334");
    });
}

server.on('error', (err) => console.error(err));
server.listen(Number(process.env.PORT) || 9333, () => {
    console.log(`Server started on port ${process.env.PORT || 9333}`);
});

const handleAuth = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(req.url || "", `https://${req.headers.host}`);
    if (url.pathname == "/auth/discord") {
        const code = url.searchParams.get('code');
        if (!code) {
            res.writeHead(404);
            res.end();
            return;
        }
        let baseurl = url.origin;
        if (baseurl.includes("localhost")) {
            baseurl = baseurl.replace("https", "http");
        }

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_APP_ID || "",
                client_secret: process.env.DISCORD_CLIENT_SECRET || "",
                grant_type: 'authorization_code',
                code: url.searchParams.get('code') || '',
                redirect_uri: baseurl + '/auth/discord',
                scope: 'identify+guilds'
            }).toString()
        });
        const token = await tokenResponse.json();
        if (!token.access_token) {
            console.log(token);
            res.writeHead(404);
            res.end();
            return;
        }

        //generate a session id
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        //get user data
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${token.token_type} ${token.access_token}`
            }
        });

        const user = await userResponse.json();
        const userCollection = db.collection('users');
        const sessionCollection = db.collection('user-sessions');

        //get user guilds
        const guildResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                authorization: `${token.token_type} ${token.access_token}`
            }
        });

        const guilds = await guildResponse.json();
        let hasAccess = false;
        for (const guild of guilds) {
            if (guild.id === process.env.DISCORD_GUILD_ID) {
                hasAccess = true;
                break;
            }
        }

        if (!hasAccess) {
            res.writeHead(200);
            res.end("You do not have access to this server");
            return;
        }

        //check if user exists
        const existingUser = await userCollection.findOne({ id: user.id });
        if (existingUser) {
            user.currency = existingUser.currency;
        } else {
            user.currency = "USD";
        }

        await userCollection.findOneAndUpdate({
            id: user.id
        }, {
            $set: user
        }, {
            upsert: true
        });

        await sessionCollection.findOneAndUpdate({
            sessionId: sessionId
        }, {
            $set: {
                id: user.id,
                sessionId: sessionId,
                token: token
            }
        }, {
            upsert: true
        });

        let cookie = `sessionId=${sessionId}; Path=/; Secure; SameSite=Strict`;
        if (baseurl.includes("localhost")) {
            cookie = `sessionId=${sessionId}; Path=/; SameSite=Strict`;
        }

        res.writeHead(302, {
            Location: "/",
            'Set-Cookie': cookie
        });
        res.end();

        return;
    }
    res.writeHead(404);
    res.end();
}

server.on('request', handleAuth);
devServer.on('request', handleAuth);

const wss = new WebSocketServer({ server });

type Method = (data: any) => Promise<any>;

const methods: { [key: string]: Method } = {
    "get-objects": getObjects,
    "create-object": createObject,
    "update-object": updateObject,
    "delete-object": deleteObject,
    "get-object": getObject,
    "query-objects": queryObjects,
    "query-database": queryDatabase,
    "get-report": getReport,
    "add-trade": addTrade
};

const connectedSessions: { [key: string]: any } = {};

wss.on("connection", (ws) => {
    ws.on("error", (err) => console.error(err));

    //console.log("Total connected users: ", wss.clients.size);

    let session: { _id: ObjectId } | null = null;

    ws.on("message", async (data) => {
        const message = JSON.parse(data.toString());

        if (message.method === "get-session") {
            connectedSessions[message.data.sessionId] = ws;
            const sesh = await db.collection('user-sessions').findOne({ sessionId: message.data.sessionId });
            if (sesh) {
                session = await db.collection('users').findOne({ id: sesh.id });
            }

            let result = null;
            if (session) {
                result = {
                    userData: session
                };
            } else {
                result = {
                    userData: {
                        id: "",
                        currency: ""
                    }
                }
            }
            ws.send(JSON.stringify({
                id: message.id,
                result
            }));
            return;
        }

        //console.log("Message received: ", message);

        if (!session) return;
        const userid = session._id.toString();

        if (methods[message.method]) {
            methods[message.method]({
                owner: userid,
                ...message.data
            }).then((result) => {
                ws.send(JSON.stringify({
                    id: message.id,
                    result
                }));
            }).catch((error) => {
                console.warn(error);
                ws.send(JSON.stringify({
                    id: message.id,
                    error
                }));
            });
        }
    });
});