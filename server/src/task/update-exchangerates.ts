import { DateTime } from "luxon";
import db from "../lib/mongo";
import polygon from "../lib/polygon";


export default async function updateExchangeRates(): Promise<boolean> {
    const collection = db.collection('exchange-rates');

    const currencies: string[] = [];
    const allAccounts = await db.collection('account').find({}).toArray();
    for (const account of allAccounts) {
        if (account.currency == 'USDT') continue; //ignore tethered
        if (!currencies.includes(account.currency)) {
            currencies.push(account.currency);
        }
    }

    if (!currencies.includes(process.env.MAIN_CURRENCY || 'USD')) {
        currencies.push(process.env.MAIN_CURRENCY || 'USD');
    }

    const currencyPairs: string[] = [];

    for (const currency of currencies) {
        for (const currency2 of currencies) {
            if (currency == currency2) continue;
            const pair = currency + currency2;
            if (!currencyPairs.includes(pair)) {
                currencyPairs.push(pair);
            }
        }
    }

    for (const pair of currencyPairs) {
        const previousClose = await polygon.forex.previousClose("C:" + pair);

        if (!previousClose || !previousClose.results || previousClose.results.length == 0) {
            console.log('No data for', pair);
            continue;
        }

        const candle = previousClose.results[0];

        let time = 0;
        if (candle.t) {
            time = candle.t || 0;
        }

        const timestamp = DateTime.fromMillis(time).toISO();

        const toWrite = {
            pair: pair,
            updated: timestamp,
            rate: candle.c,
            open: candle.o
        };

        collection.findOneAndUpdate({
            pair: pair
        }, {
            $set: toWrite
        }, {
            upsert: true
        });

        console.log('Updated', pair, 'to', previousClose.results[0].c);

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return true;
}