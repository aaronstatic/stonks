import { DateTime } from "luxon";
import bybit from "../lib/bybit";
import { getOpenCryptoHoldings } from "../lib/crypto";
import db from "../lib/mongo";


export default async function updateCrypto(_now: DateTime): Promise<boolean> {
    const collection = db.collection('crypto-1d');

    const allHoldings = await db.collection('holding').find({
        type: "Crypto"
    }).toArray();
    const tickers = allHoldings.map(holding => holding.ticker);

    const uniqueTickers = [...new Set(tickers)];

    //make sure BTC is in there
    if (!uniqueTickers.includes('BTC'))
        uniqueTickers.push('BTC');

    for (const ticker of uniqueTickers) {
        const symbol = ticker + 'USDT';
        const last = await collection.findOne({ ticker: ticker }, { sort: { timestamp: -1 } });
        const lastTimestamp = last ? DateTime.fromISO(last.timestamp) : DateTime.now().startOf('year');
        const now = DateTime.now().endOf('day');

        console.log("Updating", symbol, "from", lastTimestamp.toISO(), "to", now.toISO());

        let candles = await bybit.getKline({
            symbol: symbol,
            category: 'spot',
            interval: 'D',
            limit: 365,
            start: lastTimestamp.toMillis(),
            end: now.toMillis()
        });

        if (!candles) {
            console.log('No results for', ticker);
            continue;
        }

        if (candles.retMsg != 'OK') {
            if (candles.retMsg == 'Not supported symbols') {
                //try perpetual
                candles = await bybit.getKline({
                    symbol: symbol,
                    category: 'linear',
                    interval: 'D',
                    limit: 365,
                    start: lastTimestamp.toMillis(),
                    end: now.toMillis()
                });

                if (!candles) {
                    console.log('Cannot fetch crypto candles for', symbol);
                    continue;
                }
            } else {
                console.error(candles.retMsg);
                continue;
            }
        }

        for (const candle of candles.result.list) {
            if (ticker == 'BTC') {
                //also add to indices

                const index = {
                    ticker: 'BINANCE:BTCUSD',
                    timestamp: DateTime.fromMillis(parseInt(candle[0])).toISO(),
                    open: parseFloat(candle[1]),
                    high: parseFloat(candle[2]),
                    low: parseFloat(candle[3]),
                    close: parseFloat(candle[4]),
                    volume: parseFloat(candle[5])
                };

                await db.collection("indices-1d").findOneAndUpdate({
                    ticker: index.ticker,
                    timestamp: index.timestamp
                }, {
                    $set: index
                }, {
                    upsert: true
                });
            }
            const toWrite = {
                ticker: ticker,
                timestamp: DateTime.fromMillis(parseInt(candle[0])).toISO(),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5])
            };

            collection.findOneAndUpdate({
                ticker: ticker,
                timestamp: toWrite.timestamp
            }, {
                $set: toWrite
            }, {
                upsert: true
            });
        }


        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return true;
}