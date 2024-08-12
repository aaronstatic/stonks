import { DateTime } from "luxon";
import { Pushover } from "pushover-js";
import db from "./mongo";

const notify = new Pushover(process.env.PUSHOVER_USER || "",
    process.env.PUSHOVER_TOKEN || "");

export async function sendNotification(message: string, priority: any) {
    //record this notification in mongo so we dont repeat it per day

    //Get date in new york
    const ny = DateTime.local().setZone("America/New_York").startOf('day').toISODate();

    const notifications = db.collection("notifications");
    const existing = await notifications
        .find({ message: message, date: ny })
        .toArray();

    if (existing.length > 0) {
        return;
    }
    await notifications.insertOne({
        message: message,
        date: ny
    });

    console.log("Sending notification: " + message);
    notify.setSound("magic");
    notify.setPriority(priority);
    await notify.send("Stocks", message);
}