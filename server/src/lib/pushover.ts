import { DateTime } from "luxon";
import { Pushover } from "pushover-js";
import db from "./mongo";
import { ObjectId } from "mongodb";



export async function sendNotification(message: string, owner: string = "", priority: any = 1) {
    const notifications = db.collection("notifications");

    await notifications.insertOne({
        owner: owner,
        message: message,
        date: DateTime.now().toISO()
    });

    if (owner != "") {
        let user = await db.collection("users").findOne({ _id: new ObjectId(owner) });
        if (user && user.integration && user.integration.pushover) {
            const pushoverUser = user.integration.pushover.user || "";
            const pushoverToken = user.integration.pushover.token || "";
            if (pushoverUser !== "" && pushoverToken !== "")
                await send(pushoverUser, pushoverToken, message, priority);
        } else {
            console.log("User not found or no integration");
            return;
        }
    } else {
        //send to all users
        const users = await db.collection("users").find({}).toArray();
        for (const user of users) {
            if (user.integration && user.integration.pushover) {
                const pushoverUser = user.integration.pushover.user || "";
                const pushoverToken = user.integration.pushover.token || "";
                if (pushoverUser !== "" && pushoverToken !== "")
                    await send(pushoverUser, pushoverToken, message, priority);
            }
        }
    }
}

async function send(user: string, token: string, message: string, priority: any = 1) {
    const notify = new Pushover(user, token);
    notify.setSound("magic");
    notify.setPriority(priority);
    await notify.send("Stocks", message);
}