import { DateTime } from "luxon";
import db from "../lib/mongo";
import polygon from "../lib/polygon";

export default async function updateHoldings(_now: DateTime) {
    const collection = db.collection('holding');

    const allHoldings = await collection.find({}).toArray();

    const tickerCache: { [key: string]: any } = {};

    for (const holding of allHoldings) {
        if (holding.type === 'Stock') {
            if (holding.currency) continue;

            let info: any | undefined = undefined;
            if (tickerCache[holding.ticker]) {
                info = tickerCache[holding.ticker];
            } else {
                const result = await polygon.reference.tickerDetails(holding.ticker);
                if (result.results) {
                    info = result.results;
                    tickerCache[holding.ticker] = info;
                }
            }

            const toWrite = {
                name: holding.ticker,
                currency: 'USD'
            }

            if (info) {
                toWrite.name = info.name;
                toWrite.currency = info.currency_name.toUpperCase();
            }

            await collection.findOneAndUpdate({
                _id: holding._id
            }, {
                $set: toWrite
            });

            await new Promise(resolve => setTimeout(resolve, 500));
        }

    }

    return true;
}