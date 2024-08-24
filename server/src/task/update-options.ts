import { DateTime } from "luxon";
import db from "../lib/mongo";
import polygon from "../lib/polygon";
import { getOpenOptions, getOptionTicker } from "../lib/options";
import { getHolding } from "../lib/holdings";
import { ObjectId } from "mongodb";

export default async function updateOptions(now: DateTime): Promise<boolean> {
    now = now.setZone("America/New_York");
    if (now.weekday > 5) return true;
    if (now.hour < 9 || now.hour > 16) return true;

    const collection = db.collection('options-1d');
    const optionCollection = db.collection('option');

    const openOptions = await getOpenOptions();

    for (const option of openOptions) {
        const holding = await getHolding(option.holding);
        const expiry = DateTime.fromISO(option.expiry);
        if (!option.name) {
            const optionInfo = await polygon.reference.optionsContracts({
                underlying_ticker: holding.ticker,
                contract_type: option.type.toLowerCase(),
                strike_price: option.strike,
                expiration_date: expiry.toISODate() || ""
            });

            if (optionInfo.status != "OK") {
                console.log('Error getting option info for', option._id);
                continue;
            }
            if (!optionInfo.results || optionInfo.results.length == 0) {
                console.log('No option info results for', option.name);
                continue;
            }
            const result = optionInfo.results[0];
            option.name = result.ticker || "";

            await optionCollection.findOneAndUpdate({ _id: new ObjectId(option._id) }, { $set: { name: option.name } });
        }

        const last = await collection.findOne({ ticker: option.name }, { sort: { timestamp: -1 } });

        const startOfYear = DateTime.now().startOf('year');
        const from = last ? DateTime.fromISO(last.timestamp) : startOfYear;
        const to = expiry.endOf('day');
        const now = DateTime.now();

        if (from > to) {
            continue;
        }

        const getCandles = async () => {
            try {
                candles = await polygon.options.aggregates(
                    option.name,
                    1,
                    'day',
                    from.toMillis().toString(),
                    to.toMillis().toString()
                );
            } catch (e) {
                console.log('JS Error getting option candles for', option._id);
                console.log(e);
            }
        }

        console.log('Updating', option.name, 'from', from.toISO(), 'to', to.toISO());
        let candles: any;
        await getCandles();

        if (!candles || (candles.status != "OK" && candles.status != "DELAYED")) {
            console.log('Error getting option candles for', option._id);
            continue;
        }

        if (!candles.results) {
            console.log('No results for', option.name);
            continue;
        }
        for (const candle of candles.results) {
            if (!candle.t) continue;
            const timestamp = DateTime.fromMillis(candle.t).toISO();
            await collection.findOneAndUpdate({
                ticker: option.name,
                timestamp: timestamp
            }, {
                $set: {
                    ticker: option.name,
                    timestamp: timestamp,
                    open: candle.o,
                    high: candle.h,
                    low: candle.l,
                    close: candle.c,
                    volume: candle.v
                }
            }, {
                upsert: true
            });
        }
    }


    return true;
}