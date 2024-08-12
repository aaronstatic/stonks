import { DateTime } from "luxon";
import db from "../lib/mongo";
import TradingView from "@mathieuc/tradingview";

export const indices: string[] = [
    "SPY",
    "CBOE_DLY:VIX",
    "ICEUS_DLY:DX1!",
    "TVC:GOLD",
    "CAPITALCOM:COPPER",
    "IWM",
    "TVC:USOIL",
    "TVC:DJI",
    "QQQ",
    "BINANCE:BTCUSD"
];

const reset: string[] = [];

export default async function updateIndices(): Promise<boolean> {
    //remove BTCUSD
    indices.pop();

    for (const index of indices) {
        const candles = await db.collection('stocks-1d').find({ ticker: index }).toArray();
        if (candles.length > 0) {
            //remove from indices
            indices.splice(indices.indexOf(index), 1);
        }
    }

    return new Promise((resolve, reject) => {
        const done: string[] = [];
        const collection = db.collection('indices-1d');

        for (const index of reset) {
            collection.deleteMany({ ticker: index });
        }

        const client = new TradingView.Client(); // Creates a websocket client
        const chart = new client.Session.Chart();
        let currentIndex = "";
        let index = 0;

        chart.onError((...err: any[]) => { // Listen for errors (can avoid crash)
            console.error('Chart error:', ...err);
            reject(false);
        });

        chart.onUpdate(async () => {
            if (chart.infos.full_name != currentIndex) return;
            if (done.includes(currentIndex)) return;

            console.log("Updating index:", chart.infos.short_description);

            const updatePromises = chart.periods.map((candle: any) => {
                const time = DateTime.fromSeconds(candle.time).toISO();
                return collection.findOneAndUpdate({
                    ticker: currentIndex,
                    timestamp: time,
                }, {
                    $set: {
                        ticker: currentIndex,
                        timestamp: time,
                        open: candle.open,
                        high: candle.max,
                        low: candle.min,
                        close: candle.close,
                        volume: 0
                    }
                }, {
                    upsert: true
                });
            });

            await Promise.all(updatePromises);

            done.push(currentIndex);

            if (index === indices.length - 1) {
                chart.delete();
                client.end();
                resolve(true);
            } else {
                setTimeout(() => {
                    index++;
                    currentIndex = indices[index];
                    chart.setMarket(currentIndex, {
                        timeframe: "D",
                    });
                }, 1000);
            }
        });

        currentIndex = indices[0];
        chart.setMarket(currentIndex, {
            timeframe: "D",
        });
    });
}
