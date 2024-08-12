import db from './mongo';
import { DateTime } from 'luxon';
import { sortEvent } from './stocks';
import { Candle } from '@schema/report/candles';


export async function getIndex(ticker: string, date: string = ""): Promise<number> {
    const candle = await getIndexDayCandle(ticker, date);
    if (!candle) return 0;
    return candle.close;
}

export async function getLatestIndexCandle(ticker: string): Promise<any> {
    const collection = db.collection('indices-1d');
    const events = await collection.find({ ticker: ticker }).toArray();
    const sorted = events.sort(sortEvent);
    if (sorted.length === 0) return null;
    return sorted[sorted.length - 1];
}

export async function getIndexDayChange(ticker: string, date: string = ""): Promise<number> {
    //get previous two candles
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISO() || "";
    }

    const todayDate = DateTime.fromISO(date).setZone("UTC").toISODate();
    const yesterdayDate = DateTime.fromISO(date).minus({ days: 1 }).setZone("UTC").toISODate();

    const todayCandle = await getIndexDayCandle(ticker, todayDate || "");
    const yesterdayCandle = await getIndexDayCandle(ticker, yesterdayDate || "");

    if (!todayCandle || !yesterdayCandle) return 0;

    return todayCandle.close - yesterdayCandle.close;
}

export async function getIndexDayChangeCandle(ticker: string, date: string = ""): Promise<{ today: Candle, yesterday: Candle } | null> {
    //get previous two candles
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISO() || "";
    }

    const todayDate = DateTime.fromISO(date).setZone("UTC").toISODate();
    const yesterdayDate = DateTime.fromISO(date).minus({ days: 1 }).setZone("UTC").toISODate();

    const todayCandle = await getIndexDayCandle(ticker, todayDate || "");
    const yesterdayCandle = await getIndexDayCandle(ticker, yesterdayDate || "");

    if (!todayCandle || !yesterdayCandle) return null;

    return {
        today: todayCandle,
        yesterday: yesterdayCandle
    };
}

export async function getIndexDayCandle(ticker: string, date: string = ""): Promise<any> {
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISO() || "";
    }

    let todayDate = DateTime.fromISO(date).setZone("UTC");

    const collection = db.collection('indices-1d');
    let candle = await collection.findOne({
        ticker: ticker,
        timestamp: {
            $regex: `^${todayDate.toISODate()}`
        }
    });
    let num = 0;
    while (!candle && num < 4) {
        todayDate = todayDate.minus({ days: 1 });
        candle = await collection.findOne({
            ticker: ticker,
            timestamp: {
                $regex: `^${todayDate.toISODate()}`
            }
        });
        num++;
    }

    return candle;
}

export async function getDayChange(ticker: string, date: string = ""): Promise<number> {
    //get previous two candles
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISO() || "";
    }

    const todayDate = DateTime.fromISO(date).setZone("UTC").toISODate();
    const yesterdayDate = DateTime.fromISO(date).minus({ days: 1 }).setZone("UTC").toISODate();

    const todayCandle = await getIndexDayCandle(ticker, todayDate || "");
    const yesterdayCandle = await getIndexDayCandle(ticker, yesterdayDate || "");

    if (!todayCandle || !yesterdayCandle) return 0;

    return todayCandle.close - yesterdayCandle.close;
}