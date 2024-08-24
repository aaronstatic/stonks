import { DateTime } from "luxon";
import db from "../lib/mongo";

import yahooFinance from 'yahoo-finance2';
import { getLatestIndexCandle } from "../lib/indices";

export const indices: string[] = [
    "SPY",
    "^VIX",
    "DX-Y.NYB",
    "GC=F",
    "HG=F",
    "IWM",
    "CL=F",
    "DIA",
    "QQQ",
    "BTC"
];

export const stocks: string[] = [
    "SPY",
    "QQQ",
    "DIA",
    "IWM",
    "DIA",
    "BTC"
];

const reset: string[] = [];

export default async function updateIndices(now: DateTime): Promise<boolean> {
    now = now.setZone("America/New_York");
    if (now.weekday > 5) return true; //only run on weekdays
    if (now.hour < 8 || now.hour > 16) return true; //only run during market hours
    if (now.minute == 30) return true; //only run halfway through the hour

    for (const index of stocks) {
        if (indices.includes(index)) {
            indices.splice(indices.indexOf(index), 1);
        }
    }

    console.log(`Updating indices: ${indices.join(", ")}`);

    const collection = db.collection('indices-1d');

    for (const index of reset) {
        collection.deleteMany({ ticker: index });
    }

    for (const index of indices) {

        //get last date in db
        const lastCandle = await getLatestIndexCandle(index);
        let start = lastCandle ? DateTime.fromISO(lastCandle.timestamp).toUTC() : DateTime.fromISO("2023-01-01T00:00:00.000Z");
        const end = DateTime.now().startOf('day').plus({ days: 1 }).toUTC();

        if (start >= end) {
            start = end.minus({ days: 1 });
        }

        console.log(`Updating ${index} from ${start.toISODate()} to ${end.toISODate()}`);

        const data = await yahooFinance.chart(index, {
            interval: '1d',
            period1: start.toISODate() || "",
            period2: end.toISODate() || ""
        });

        if (!data) {
            console.error(`Failed to get data for ${index}`);
            continue;
        }

        if (!data.quotes) {
            console.error(`No quotes for ${index}`);
            continue;
        }

        if (index == "DXY.NYB") {
            console.log(data);
        }

        for (const quote of data.quotes) {
            const date = DateTime.fromJSDate(quote.date).toUTC().toISO();
            if (quote.open == null) continue;
            await collection.findOneAndUpdate(
                { ticker: index, timestamp: date },
                {
                    $set: {
                        ticker: index,
                        timestamp: date,
                        open: quote.open,
                        high: quote.high,
                        low: quote.low,
                        close: quote.close,
                        volume: quote.volume
                    }
                },
                { upsert: true }
            );
        }

        //wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
}
