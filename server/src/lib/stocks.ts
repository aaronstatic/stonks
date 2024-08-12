import Holding from '@schema/holding';
import db from './mongo';
import { DateTime } from 'luxon';
import { castHolding } from './holdings';

export function sortEvent(a: any, b: any): number {
    const A = DateTime.fromISO(a.timestamp);
    const B = DateTime.fromISO(b.timestamp);
    return A < B ? -1 : A > B ? 1 : 0;
}

export async function getOpenStockHoldings(owner: string = "", toDate: string = ""): Promise<Holding[]> {
    const collection = db.collection('holding');
    const tradeCollection = db.collection('trade');
    let holdings;
    const openHoldings = [];

    const toDateDT = toDate ? DateTime.fromISO(toDate) : DateTime.now().setZone("UTC");

    if (owner == "") {
        holdings = await collection.find({ type: "Stock" }).toArray();
    } else {
        holdings = await collection.find({ owner: owner, type: "Stock" }).toArray();
    }

    for (const doc of holdings) {
        const holding = castHolding(doc);
        let trades = await tradeCollection.find({ holding: holding._id }).toArray();

        trades = trades.sort(sortEvent);

        let quantity = 0;
        for (const trade of trades) {
            const tradeTimestamp = DateTime.fromISO(trade.timestamp).toUTC();
            if (tradeTimestamp > toDateDT) {
                break;
            }
            if (trade.type === 'BUY') {
                quantity += trade.quantity;
            } else {
                quantity -= trade.quantity;
            }

        }
        if (quantity > 0) {
            openHoldings.push(holding);
        }
    }

    return openHoldings;
}

export async function getStockPrice(ticker: string, date: string = ""): Promise<number> {
    const candle = await getStockDayCandle(ticker, date);
    if (!candle) return 0;
    return candle.close;
}

export async function getLatestStockCandle(ticker: string): Promise<any> {
    const collection = db.collection('stocks-1d');
    const events = await collection.find({ ticker: ticker }).toArray();
    const sorted = events.sort(sortEvent);
    if (sorted.length === 0) return null;
    return sorted[sorted.length - 1];
}

export async function getStockDayChangeCandle(ticker: string, date: string = ""): Promise<{ today: any, yesterday: any } | null> {
    //get previous two candles
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISODate() || "";
    }

    const todayDate = DateTime.fromISO(date + "T00:00:00.000Z").setZone("UTC");
    const todayCandle = await getStockDayCandle(ticker, todayDate.toISODate() || "");

    const todayCandleDate = DateTime.fromISO(todayCandle.timestamp).setZone("UTC");
    const yesterdayDate = todayCandleDate.minus({ days: 1 }).setZone("UTC");

    const yesterdayCandle = await getStockDayCandle(ticker, yesterdayDate.toISODate() || "");

    if (!todayCandle || !yesterdayCandle) return null;

    return {
        today: todayCandle,
        yesterday: yesterdayCandle
    };
}

export async function getStockDayCandle(ticker: string, date: string = "", findClosest: boolean = true): Promise<any> {
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISODate() || "";
    }

    const collection = db.collection('stocks-1d');
    let candle = await collection.findOne({
        ticker: ticker,
        timestamp: {
            $regex: `^${date}`
        }
    });
    if (findClosest) {
        let num = 0;
        let todayDate = DateTime.fromISO(date + "T00:00:00.000Z").setZone("UTC");
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
    }

    return candle;
}

export async function getDayChange(ticker: string, date: string = ""): Promise<number> {
    //get previous two candles
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISODate() || "";
    }

    const todayDate = DateTime.fromISO(date + "T00:00:00.000Z").setZone("UTC");
    const yesterdayDate = todayDate.minus({ days: 1 }).setZone("UTC");

    const todayCandle = await getStockDayCandle(ticker, todayDate.toISODate() || "", false);
    const yesterdayCandle = await getStockDayCandle(ticker, yesterdayDate.toISODate() || "");

    if (!todayCandle || !yesterdayCandle) return 0;

    return todayCandle.close - yesterdayCandle.close;
}

export async function getOpenQuantity(owner: string, ticker: string): Promise<number> {
    const collection = db.collection('holding');
    const tradeCollection = db.collection('trade');
    const holding = await collection.findOne({ owner: owner, ticker: ticker });
    if (!holding) return 0;
    let trades = await tradeCollection.find({ holding: holding._id }).toArray();

    trades = trades.sort(sortEvent);

    let quantity = 0;
    for (const trade of trades) {
        if (trade.type === 'BUY') {
            quantity += trade.quantity;
        } else {
            quantity -= trade.quantity;
        }
    }

    return quantity;
}

export async function getStockDetails(ticker: string): Promise<any> {
    const collection = db.collection('stocks-detail');
    return await collection.findOne({ ticker: ticker });
}

export async function getNextExpiryGamma(ticker: string): Promise<any> {
    const collection = db.collection('options-gamma');
    const today = DateTime.now().setZone("UTC").startOf('day').minus({ days: 1 });
    const gamma = await collection.find({ ticker: ticker }).toArray();

    let earliest = null;
    let earliestDoc = null;

    for (const doc of gamma) {
        const date = DateTime.fromISO(doc.date).toUTC();
        if (date >= today) {
            if (!earliest || date < earliest) {
                earliest = date;
                earliestDoc = doc;
            }
        }
    }

    return earliestDoc;
}

export async function getNextExpiryGammaZone(ticker: string): Promise<number> {
    const gamma = await getNextExpiryGamma(ticker);
    const price = await getStockPrice(ticker);
    if (!gamma) return 0;
    if (gamma.levels.gammaFlip === null || gamma.levels.gammaFlip == 0) {
        return 0;
    } else if (gamma.levels.gammaFlip > price) {
        return -1;
    } else if (gamma.levels.gammaFlip < price) {
        return 1;
    }
    return 0;
}