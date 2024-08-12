import Trade from "@schema/trade";
import db from "../../lib/mongo";
import Transaction from "@schema/transaction";
import { ObjectId } from "mongodb";

export default async function tradeAfterWrite(ob: Object) {
    console.log('tradeAfterWrite');
    const trade = ob as Trade;
    if (!trade.account) return trade;

    console.log(trade.holding);

    const transactions = db.collection('transaction');
    const holdings = db.collection('holding');

    const holding = await holdings.findOne({ owner: trade.owner, _id: new ObjectId(trade.holding) });
    if (!holding) return trade;

    console.log(holding.ticker);

    let mul = -1;
    if (trade.type === 'SELL') mul = 1;
    const total = (trade.quantity * trade.price * mul) - trade.fees;

    const description = `${trade.type} ${trade.quantity} x ${holding.ticker} @ ${trade.price}`;

    const transaction = {
        owner: trade.owner,
        account: trade.account,
        amount: total,
        timestamp: trade.timestamp,
        description: description,
        trade: trade._id as string
    } as Transaction;

    await transactions.findOneAndUpdate({
        owner: trade.owner,
        account: trade.account,
        trade: trade._id as string
    }, { $set: transaction }, { upsert: true });

    console.log(transaction);

    return trade;
}