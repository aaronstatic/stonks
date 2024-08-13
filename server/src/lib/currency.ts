import db from "./mongo";

export async function getExchangeRate(pair: string): Promise<number> {
    if (pair == "USDUSD") return 1;
    const collection = db.collection('exchange-rates');
    const rate = await collection.findOne({ pair: pair });
    if (!rate) return 0;
    return rate.rate;
}