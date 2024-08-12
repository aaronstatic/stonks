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

const discord = new DiscordBot();

const server = https.createServer({
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT
});

server.on('error', (err) => console.error(err));
server.listen(Number(process.env.PORT) || 9333, () => {
    console.log(`Server started on port ${process.env.PORT || 9333}`);
});

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
    "add-trade": addTrade,
    "get-userdata": async (data) => {
        return {
            id: process.env.DEFAULT_USER,
            currency: process.env.MAIN_CURRENCY
        };
    }
};

wss.on("connection", (ws) => {
    const userid = process.env.DEFAULT_USER;

    ws.on("error", (err) => console.error(err));

    console.log("Total connected users: ", wss.clients.size);

    ws.on("message", (data) => {
        const message = JSON.parse(data.toString());

        console.log("Message received: ", message);

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