import { DateTime, DateTimeUnit } from "luxon";
import bybit from "../lib/bybit";
import { getOpenCryptoHoldings } from "../lib/crypto";
import db from "../lib/mongo";
import { KlineIntervalV3 } from "bybit-api";


export default async function updateCrypto(_now: DateTime): Promise<boolean> {
    const collection = db.collection('crypto-1d');

    const openHoldings = await getOpenCryptoHoldings();
    const tickers = openHoldings.map(holding => holding.ticker);
    const watchlistItems = await db.collection('watchlist').find({
        type: "Crypto"
    }).toArray();
    const watchlistTickers = watchlistItems.map(item => item.ticker);
    for (const ticker of watchlistTickers) {
        if (!tickers.includes(ticker)) {
            tickers.push(ticker);
        }
    }

    const uniqueTickers = [...new Set(tickers)];

    //make sure BTC is in there
    if (!uniqueTickers.includes('BTC'))
        uniqueTickers.push('BTC');

    console.log("Updating crypto", uniqueTickers);

    for (const ticker of uniqueTickers) {
        await updateCandles(ticker, '1d');
        await updateCandles(ticker, '4h');
        await updateCandles(ticker, '1h');
        await updateCandles(ticker, '15m');
    }

    return true;
}

async function updateCandles(ticker: string, timeframe: string) {
    const collection = db.collection(`crypto-${timeframe}`);
    const symbol = ticker + 'USDT';

    const last = await collection.findOne({ ticker: ticker }, { sort: { timestamp: -1 } });
    let earliest: DateTime = DateTime.now().minus({ years: 1 });
    if (timeframe == '1h') {
        earliest = DateTime.now().minus({ days: 30 });
    }
    if (timeframe == '15m') {
        earliest = DateTime.now().minus({ days: 7 });
    }
    const lastTimestamp = last ? DateTime.fromISO(last.timestamp) : earliest;
    const now = DateTime.now().endOf('day');

    console.log("Updating", symbol, "from", lastTimestamp.toISO(), "to", now.toISO());

    let interval: KlineIntervalV3 = 'D';
    if (timeframe == '4h') {
        interval = '240';
    }
    if (timeframe == '1h') {
        interval = '60';
    }
    if (timeframe == '15m') {
        interval = '15';
    }

    let candles = await bybit.getKline({
        symbol: symbol,
        category: 'spot',
        interval: interval,
        limit: 1000,
        start: lastTimestamp.toMillis(),
        end: now.toMillis()
    });

    if (!candles) {
        console.log('No results for', ticker);
        return;
    }

    if (candles.retMsg != 'OK') {
        if (candles.retMsg == 'Not supported symbols') {
            //try perpetual
            candles = await bybit.getKline({
                symbol: symbol,
                category: 'linear',
                interval: interval,
                limit: 1000,
                start: lastTimestamp.toMillis(),
                end: now.toMillis()
            });

            if (!candles) {
                console.log('Cannot fetch crypto candles for', symbol);
                return;
            }
        } else {
            console.error(candles.retMsg);
            return;
        }
    }

    for (const candle of candles.result.list) {
        if (ticker == 'BTC' && timeframe == '1d') {
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