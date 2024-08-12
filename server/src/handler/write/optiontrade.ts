import OptionTrade from "@schema/optiontrade";
import db from "../../lib/mongo";
import Transaction from "@schema/transaction";
import { ObjectId } from "mongodb";

export default async function optionTradeAfterWrite(ob: Object) {
    const trade = ob as OptionTrade;
    if (!trade.account) return trade;

    const transactions = db.collection('transaction');
    const options = db.collection('option');
    const holdings = db.collection('holding');

    const option = await options.findOne({ owner: trade.owner, _id: new ObjectId(trade.option) });
    if (!option) return trade;

    const holding = await holdings.findOne({ owner: trade.owner, _id: new ObjectId(option.holding) });
    if (!holding) return trade;

    let mul = -1;
    if (trade.type === 'SELL') mul = 1;
    const total = (100 * trade.quantity * trade.price * mul) - trade.fees;

    const description = `${trade.type} ${trade.quantity} x ${holding.ticker} ${option.strike} ${option.type} ${option.expiry} @ ${trade.price}`;

    const transaction = {
        owner: trade.owner,
        account: trade.account,
        amount: total,
        timestamp: trade.timestamp,
        description: description,
        option: trade.option,
        trade: trade._id as string
    } as Transaction;

    await transactions.findOneAndUpdate({
        owner: trade.owner,
        account: trade.account,
        trade: trade._id as string
    }, { $set: transaction }, { upsert: true });

    return trade;
}