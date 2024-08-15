import Holding from "@schema/holding";
import Trade from "@schema/trade";
import MultiLegOption from "@schema/multilegoption";
import MultiLegOptionTrade from "@schema/multilegoptiontrade";
import { getHolding } from "../lib/holdings";
import Option from "@schema/option";
import db from "../lib/mongo";
import { castAsOptionTrade, castAsTrade } from "../lib/trades";
import { getMultiLegOption, getOption, getOptionName } from "../lib/options";
import { DateTime } from "luxon";
import trendingSymbols from "yahoo-finance2/dist/esm/src/modules/insights";
import { ObjectId } from "mongodb";

export default async function allTrades(owner: string, params: any): Promise<Trade[]> {
    const collection = db.collection('trade');
    const optionCollection = db.collection('optiontrade');
    const multilegCollection = db.collection('multilegoption');
    const multilegOptionTradeCollection = db.collection('multilegoptiontrade');

    const trades = await collection.find({ owner }).toArray();
    const optionTrades = await optionCollection.find({ owner }).toArray();
    const multilegOptions = await multilegCollection.find({ owner }).toArray();

    const allTrades: Trade[] = [];
    const holdings: { [key: string]: Holding } = {};
    const options: { [key: string]: Option } = {};
    const balances: { [key: string]: number } = {};

    for (const doc of trades) {
        const trade = castAsTrade(doc);
        if (!holdings[trade.holding]) {
            holdings[trade.holding] = await getHolding(trade.holding);
        }
        if (trade.type === 'BUY') {
            balances[trade.holding] = (balances[trade.holding] || 0) + trade.quantity - (trade.qtyFees || 0);
        } else {
            balances[trade.holding] = (balances[trade.holding] || 0) - trade.quantity;
        }
        const holding = holdings[trade.holding];
        trade.balance = balances[trade.holding];
        trade.holdingData = holding;
        trade.name = holding.ticker;
        trade.holdingType = holding.type;
        trade.total = (trade.type === 'BUY' ? -1 : 1) * trade.quantity * trade.price - trade.fees;
        allTrades.push(trade);
    }

    for (const doc of optionTrades) {
        const optionTrade = castAsOptionTrade(doc);
        if (optionTrade.multi) continue; //ignore multi-leg trades, handled below

        if (!options[optionTrade.option]) {
            options[optionTrade.option] = await getOption(optionTrade.option);
        }
        if (!holdings[options[optionTrade.option].holding]) {
            holdings[options[optionTrade.option].holding] = await getHolding(options[optionTrade.option].holding);
        }
        if (optionTrade.type === 'BUY') {
            balances[optionTrade.option] = (balances[optionTrade.option] || 0) + optionTrade.quantity;
        } else {
            balances[optionTrade.option] = (balances[optionTrade.option] || 0) - optionTrade.quantity;
        }
        const holding = holdings[options[optionTrade.option].holding];
        const option = options[optionTrade.option];
        const name = getOptionName(option, holding);
        const trade: Trade = {
            _id: optionTrade._id,
            account: optionTrade.account,
            type: optionTrade.type,
            holding: options[optionTrade.option].holding,
            transaction: optionTrade.transaction,
            quantity: optionTrade.quantity,
            price: optionTrade.price,
            fees: optionTrade.fees,
            qtyFees: 0,
            total: (optionTrade.type === 'BUY' ? -1 : 1) * optionTrade.quantity * optionTrade.price * 100 - optionTrade.fees,
            balance: balances[optionTrade.option],
            timestamp: optionTrade.timestamp,
            owner: optionTrade.owner,
            name: name,
            holdingData: holdings[options[optionTrade.option].holding],
            holdingType: "Option"
        };

        allTrades.push(trade);
    }

    for (const doc of multilegOptions) {
        const multilegOption = await getMultiLegOption(doc._id.toString());
        const optionTrades = await multilegOptionTradeCollection.find({ multi: multilegOption._id }).toArray();
        const holding = await getHolding(multilegOption.holding);
        const name = multilegOption.name;

        let balance = 0;

        for (const tradeDoc of optionTrades) {
            let total = 0;
            let fees = 0;
            let price = 0;

            if (tradeDoc.type === 'BUY') {
                balance += tradeDoc.quantity;
            }
            for (const legid of tradeDoc.optiontrades) {
                const legTrade = await optionCollection.findOne({ _id: new ObjectId(legid as string) });
                if (!legTrade) continue;
                if (legTrade.type === 'BUY') {
                    total -= legTrade.quantity * legTrade.price * 100;
                    fees += legTrade.fees;
                    price += legTrade.price;
                } else {
                    total += legTrade.quantity * legTrade.price * 100;
                    fees += legTrade.fees;
                    price -= legTrade.price;
                }
            }
            const trade: Trade = {
                _id: tradeDoc._id.toString(),
                account: tradeDoc.account,
                type: tradeDoc.type,
                holding: multilegOption.holding,
                transaction: "MULTI",
                quantity: tradeDoc.quantity,
                price: price,
                fees: fees,
                qtyFees: 0,
                total: total,
                balance: balance,
                timestamp: tradeDoc.timestamp,
                owner: multilegOption.owner,
                name: name,
                holdingData: holding,
                holdingType: "MultiLegOption"
            };
            allTrades.push(trade);
        }

    }


    allTrades.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });

    allTrades.reverse();

    return allTrades;
}