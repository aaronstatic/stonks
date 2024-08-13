import Option from '@schema/option';
import db from './mongo';
import { sortEvent } from './stocks';
import { ObjectId } from 'mongodb';
import polygon from './polygon';
import { DateTime } from 'luxon';
import { getHolding } from './holdings';

export function castOption(doc: any): Option {
    return {
        name: doc.name as string,
        _id: doc._id.toString(),
        owner: doc.owner as string,
        holding: doc.holding as string,
        strike: doc.strike as number,
        type: doc.type as string,
        expiry: doc.expiry as string
    };
}

export async function getOpenOptions(owner: string = "", toDate: string = ""): Promise<Option[]> {
    const collection = db.collection('option');
    const tradeCollection = db.collection('optiontrade');
    let options;
    const openOptions = [];

    const toDateDT = toDate ? DateTime.fromISO(toDate) : DateTime.now().setZone("UTC");

    if (owner == "") {
        options = await collection.find({}).toArray();
    } else {
        options = await collection.find({ owner: owner }).toArray();
    }

    for (const doc of options) {
        const option = castOption(doc);

        //check if expired
        const expiry = DateTime.fromISO(option.expiry);
        const now = DateTime.now().setZone("UTC").minus({ days: 1 });
        if (expiry < now) continue;

        let trades = await tradeCollection.find({ option: option._id }).toArray();

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
        if (quantity != 0) {
            openOptions.push(option);
        }
    }

    return openOptions;
}

export async function getOptionPrice(optionId: string, toDate: string = ""): Promise<number> {
    const candle = await getOptionDayCandle(optionId, toDate);
    if (!candle) return 0;
    return candle.close;
}

export async function getLatestOptionCandle(optionId: string): Promise<any> {
    const ticker = await getOptionTicker(optionId);

    const collection = db.collection('options-1d');
    const events = await collection.find({ ticker: ticker }).toArray();
    const sorted = events.sort(sortEvent);
    if (sorted.length === 0) return null;
    return sorted[sorted.length - 1];
}

export async function getOptionDayCandle(optionId: string, toDate: string = "", findClosest: boolean = true): Promise<any> {
    const ticker = await getOptionTicker(optionId);
    const collection = db.collection('options-1d');

    if (toDate === "") {
        toDate = DateTime.now().setZone("UTC").toISODate() || "";
    }

    let candle = await collection.findOne({
        ticker: ticker,
        timestamp: {
            $regex: new RegExp(`^${toDate}`)
        }
    });

    if (findClosest) {
        let num = 0;
        let todayDate = DateTime.fromISO(toDate + "T00:00:00.000Z").toUTC();
        while (!candle && num < 7) {
            todayDate = todayDate.minus({ days: 1 });
            candle = await collection.findOne({
                ticker: ticker,
                timestamp: {
                    $regex: new RegExp(`^${todayDate.toISODate()}`)
                }
            });
            num++;
        }
    }

    return candle;
}

export async function getOptionDayChange(optionId: string, date: string = ""): Promise<number> {
    //get previous two candles
    if (date == "") {
        date = DateTime.now().setZone("UTC").toISODate() || "";
    }

    const todayDate = DateTime.fromISO(date + "T00:00:00.000Z").setZone("UTC");
    const yesterdayDate = todayDate.minus({ days: 1 }).setZone("UTC");

    const todayCandle = await getOptionDayCandle(optionId, todayDate.toISODate() || "", false);
    const yesterdayCandle = await getOptionDayCandle(optionId, yesterdayDate.toISODate() || "");

    if (!todayCandle || !yesterdayCandle) return 0;

    return todayCandle.close - yesterdayCandle.close;
}

export async function getOptionTicker(optionId: string): Promise<string> {
    const collection = db.collection('option');
    const option = await collection.findOne({ _id: new ObjectId(optionId) });
    if (!option) return "";
    if (option.name == "") {
        const holding = await getHolding(option.holding);
        const expiry = DateTime.fromISO(option.expiry).toFormat('yyyy-MM-dd');
        const optionInfo = await polygon.reference.optionsContracts({
            underlying_ticker: holding.ticker,
            contract_type: option.type.toLowerCase(),
            strike_price: option.strike,
            expiration_date: expiry
        });

        if (optionInfo.status != "OK") {
            console.log('Error getting option info for', option._id);
            return "";
        }
        if (!optionInfo.results || optionInfo.results.length == 0) {
            console.log('No results for', option.name);
            return "";
        }
        const result = optionInfo.results[0];
        option.name = result.ticker || "";

        await collection.findOneAndUpdate({ _id: new ObjectId(option._id) }, { $set: { name: option.name } });
    }
    return option.name;
}

export async function getOpenOptionQuantity(id: string): Promise<number> {
    const collection = db.collection('optiontrade');
    const trades = await collection.find({ option: id }).toArray();
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

export async function getOpenOptionSnapshot(id: string, toDate: string = ""): Promise<{ qty: number, avgPrice: number }> {

    let today = DateTime.fromISO(toDate + "T00:00:00.000Z");
    if (toDate === "") {
        today = DateTime.now().endOf('day').toUTC();
    }

    const collection = db.collection('optiontrade');
    const trades = await collection.find({ option: id }).toArray();
    let quantity = 0;
    let cost = 0;
    for (const trade of trades) {
        const tradeTimestamp = DateTime.fromISO(trade.timestamp).toUTC();
        if (tradeTimestamp > today) {
            continue;
        }
        if (trade.type === 'BUY') {
            quantity += trade.quantity;
            cost += trade.quantity * trade.price * 100;
        } else {
            quantity -= trade.quantity;
            cost -= trade.quantity * trade.price * 100;
        }
    }
    return { qty: quantity, avgPrice: cost / quantity };

}