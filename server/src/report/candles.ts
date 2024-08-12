import { CandleReport, Candle } from "@schema/report/candles";
import db from "../lib/mongo";
import { DateTime } from "luxon";

export default async function candleReport(owner: string = "", params: any = {}): Promise<CandleReport> {
    const ticker: string = params.ticker;
    const type: string = params.type;
    const candles: Candle[] = [];

    let candleDocs = [];
    if (type == "Stock") {
        candleDocs = await db.collection('stocks-1d').find({ ticker: ticker }).toArray();
    } else if (type == "Crypto") {
        candleDocs = await db.collection('crypto-1d').find({ ticker: ticker }).toArray();
    } else if (type == "Index") {
        candleDocs = await db.collection('indices-1d').find({ ticker: ticker }).toArray();
    } else {
        return {
            ticker: ticker,
            candles
        }
    }

    candleDocs.sort((a, b) => {
        const A = DateTime.fromISO(a.timestamp);
        const B = DateTime.fromISO(b.timestamp);
        return A.toMillis() - B.toMillis();
    });

    for (const doc of candleDocs) {
        candles.push({
            timestamp: doc.timestamp,
            open: doc.open,
            high: doc.high,
            low: doc.low,
            close: doc.close,
            volume: doc.volume
        });
    }

    return {
        ticker: ticker,
        candles
    }
}