import { DateTime } from "luxon";
import db from "../lib/mongo";
import openHoldings from "../report/dashboard";

export default async function updateHistory() {
    const collection = db.collection('history');
    const owner = process.env.DEFAULT_USER || "";

    let currentDay = DateTime.now().toUTC().startOf("day").minus({ days: 2 });
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

    return true;
}