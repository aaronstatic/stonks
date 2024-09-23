import { DateTime } from "luxon";
import db from "../lib/mongo";
import openHoldings from "../report/dashboard";

export default async function updateHistory(_now: DateTime) {
    const userCollection = db.collection('users');

    const users = await userCollection.find({}).toArray();
    for (const user of users) {
        console.log("Updating history for", user.username);
        await updateHistoryForUser(user._id.toString());
    }

    const portfolios = await db.collection('portfolio').find({}).toArray();
    for (const portfolio of portfolios) {
        console.log("Updating history for", portfolio.name);
        await updateHistoryForUser(portfolio._id.toString());
    }

    return true;
}

async function updateHistoryForUser(owner: string) {
    const collection = db.collection('history');
    let currentDay = DateTime.now().toUTC().startOf("day").minus({ days: 2 });
    //let currentDay = DateTime.now().toUTC().startOf("day").minus({ days: 60 });
    const end = DateTime.now().toUTC().startOf("day");

    while (currentDay <= end) {
        console.log('Updating history for', currentDay.toISODate());
        const dayReport = await openHoldings(owner, { toDate: currentDay.toISODate() });

        await collection.findOneAndUpdate(
            { owner: owner, date: currentDay.toISO() },
            { $set: { owner: owner, date: currentDay.toISO(), report: dayReport } },
            { upsert: true }
        );
        currentDay = currentDay.plus({ days: 1 });
    }
}