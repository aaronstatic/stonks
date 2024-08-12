import Holding from "@schema/holding";
import { castHolding } from "./holdings";
import db from "./mongo";
import { sortEvent } from "./stocks";
import { DateTime } from "luxon";

export async function getOpenCryptoHoldings(owner: string = "", toDate: string = ""): Promise<Holding[]> {
    const collection = db.collection('holding');
    const tradeCollection = db.collection('trade');
    let holdings;
    const openHoldings = [];

    const toDateDT = toDate ? DateTime.fromISO(toDate) : DateTime.now().setZone("UTC");

    if (owner == "") {
        holdings = await collection.find({ type: "Crypto" }).toArray();
    } else {
        holdings = await collection.find({ owner: owner, type: "Crypto" }).toArray();
    }

    for (const doc of holdings) {
        const holding = castHolding(doc);
        let trades = await tradeCollection.find({ holding: holding._id }).toArray();

        trades = trades.sort(sortEvent);

        let quantity = 0;
        for (const trade of trades) {
            if (trade.type === 'BUY') {
                quantity += trade.quantity;
            } else {
                quantity -= trade.quantity;
            }
            const tradeTimestamp = DateTime.fromISO(trade.timestamp).toUTC();
            if (tradeTimestamp > toDateDT) {
                break;
            }
        }
        if (quantity > 0) {
            openHoldings.push(holding);
        }
    }

    return openHoldings;
}

export async function getCryptoPrice(ticker: string, date: string = ""): Promise<number> {
    const candle = await getCryptoDayCandle(ticker, date);
    if (!candle) return 0;
    return candle.close;
}

export async function getCryptoDayCandle(ticker: string, date: string = ""): Promise<any> {
    if (date === "") {
        date = DateTime.now().toUTC().toISODate();
    }

    const collection = db.collection('crypto-1d');
    const candle = await collection.findOne({
        ticker: ticker,
        timestamp: {
            $regex: `^${date}`
        }
    });
    return candle;
}