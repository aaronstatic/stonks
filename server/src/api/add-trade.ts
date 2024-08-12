import { ObjectId } from "mongodb";
import db from "../lib/mongo";
import { DateTime } from "luxon";

export default function addTrade(data: { owner: string, tradeType: string, ticker: string, trade: any, option: any }): Promise<Object> {
    const { owner, tradeType, ticker, trade, option } = data;
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('trade');
        const holdingCollection = db.collection('holding');
        const optionCollection = db.collection('option');
        const accountCollection = db.collection('account');
        const optionTrades = db.collection('optiontrade');
        const transactions = db.collection('transaction');

        if (tradeType == "") {
            reject("Trade type is required");
            return;
        }

        console.log(tradeType);

        const account = await accountCollection.findOne({
            owner,
            _id: new ObjectId(trade.account as string)
        });
        if (!account) {
            reject("Account not found");
            return;
        }

        const holding = await holdingCollection.findOne({
            owner,
            ticker,
            type: tradeType == "Option" ? "Stock" : tradeType
        });
        let holdingId = "";
        let risk = 5;

        if (!holding) {
            const result = await holdingCollection.insertOne({
                owner,
                ticker,
                risk,
                currency: account.currency,
                name: "",
                type: tradeType == "Option" ? "Stock" : tradeType
            });
            holdingId = result.insertedId.toString();
        } else {
            holdingId = holding._id.toString();
        }

        if (tradeType === "Option") {
            let optionId = "";
            const optionResult = await optionCollection.findOne({
                owner,
                holding: holdingId,
                strike: option.strike,
                expiry: option.expiry,
                type: option.type
            });
            if (optionResult) {
                optionId = optionResult._id.toString();
            } else {
                const result = await optionCollection.insertOne({
                    owner,
                    holding: holdingId,
                    strike: option.strike,
                    expiry: option.expiry,
                    type: option.type
                });
                optionId = result.insertedId.toString();
            }
            const result = await optionTrades.insertOne({
                owner,
                account: trade.account,
                option: optionId,
                type: trade.type,
                quantity: trade.quantity,
                price: trade.price,
                fees: trade.fees,
                timestamp: trade.timestamp
            });
            const tradeId = result.insertedId.toString();

            let mul = -1;
            if (trade.type === "SELL") {
                mul = 1;
            }

            const transaction = await transactions.insertOne({
                owner,
                account: trade.account,
                trade: tradeId,
                timestamp: trade.timestamp,
                description: `${trade.type} ${trade.quantity} x ${ticker} ${option.strike}${option.type == "Call" ? "C" : "P"} ${DateTime.fromISO(option.expiry).toLocaleString(DateTime.DATE_SHORT)}`,
                amount: (mul * trade.quantity * trade.price * 100) - trade.fees,
            });

            resolve({ _id: tradeId });
        } else {
            const result = await collection.insertOne({
                owner,
                account: trade.account,
                holding: holdingId,
                type: trade.type,
                quantity: trade.quantity,
                price: trade.price,
                fees: trade.fees,
                timestamp: trade.timestamp
            });
            const tradeId = result.insertedId.toString();

            let mul = -1;
            if (trade.type === "SELL") {
                mul = 1;
            }

            const transaction = await transactions.insertOne({
                owner,
                account: trade.account,
                trade: tradeId,
                timestamp: trade.timestamp,
                description: `${trade.type} ${trade.quantity} x ${ticker} @ ${trade.price}`,
                amount: (mul * trade.quantity * trade.price) - trade.fees,
            });

            resolve({ _id: tradeId });
        }
    });
}