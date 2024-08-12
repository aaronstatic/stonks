import { ObjectId } from "mongodb";
import bybit from "../lib/bybit";
import db from "../lib/mongo";
import { DateTime } from 'luxon';
import { TransactionLogV5 } from "bybit-api";

const orderIds: { [key: string]: number } = {};

export default async function updateBybit(): Promise<boolean> {
    const accountCollection = db.collection('account');
    const account = await accountCollection.findOne({
        _id: new ObjectId(process.env.BYBIT_ACCOUNT)
    });
    if (!account) return true;

    let start = DateTime.local().minus({ hours: 1 });
    let end = DateTime.local();

    console.log("Updating transactions from", start.toISO(), "to", end.toISO());
    const result = await updateTransactions(start, end, account.currency);
    if (!result) return false;

    const transactionCollection = db.collection('transaction');

    //Cleanup zombie transactions that weren't matched with a trade
    await transactionCollection.deleteMany({
        owner: process.env.BYBIT_OWNER,
        account: process.env.BYBIT_ACCOUNT,
        amount: { $exists: false }
    });

    return true;
}

async function removeAllByBitTransactions() {
    const transactionCollection = db.collection('transaction');

    await transactionCollection.deleteMany({
        owner: process.env.BYBIT_OWNER,
        account: process.env.BYBIT_ACCOUNT,
        src: "ByBit"
    });

    const tradeCollection = db.collection('trade');

    await tradeCollection.deleteMany({
        owner: process.env.BYBIT_OWNER,
        account: process.env.BYBIT_ACCOUNT,
        src: "ByBit"
    });

    return true;
}

async function updateTransactions(from: DateTime, to: DateTime, currency: string = 'USDT', pageCursor: string = "") {
    const transactions = await bybit.getTransactionLog({
        accountType: 'UNIFIED',
        startTime: from.toMillis(),
        endTime: to.toMillis(),
        limit: 50,
        cursor: pageCursor
    });

    if (transactions.retMsg !== 'OK') {
        console.error(transactions.retMsg);
        return false;
    }

    if (transactions.result.list.length === 0) {
        return true;
    }

    console.log(transactions.retMsg, transactions.result.list.length);

    for (const transaction of transactions.result.list) {
        processTransaction(transaction, process.env.BYBIT_ACCOUNT || "", currency);
    }

    if (transactions.result.nextPageCursor) {
        return updateTransactions(from, to, currency, transactions.result.nextPageCursor);
    }

    return true;
}

async function processTransaction(transaction: TransactionLogV5, accountId: string, currency: string) {
    if (transaction.type == "TRADE") {
        if (transaction.category == "spot" && transaction.currency != currency) {
            return await processSpotTrade(transaction, accountId, currency);
        }
        if (transaction.category == "spot" && transaction.currency == currency) {
            return await processSpotTransaction(transaction, accountId);
        }
        if (transaction.category == "linear") {
            return await processDerivativeTrade(transaction, accountId);
        }
    }

    if (transaction.type == "TRANSFER_IN" || transaction.type == "TRANSFER_OUT") {
        return await processTransfer(transaction, accountId);
    }

    if (transaction.currency == currency) {
        return await processOtherTransaction(transaction, accountId);
    }

    console.warn("Unhandled Transaction:", transaction.type, transaction.category, transaction.currency, transaction.symbol, transaction.change);
}

async function processSpotTransaction(transaction: TransactionLogV5, accountId: string) {
    const tradeCollection = db.collection('trade');
    const transactionCollection = db.collection('transaction');

    const transactionResult = await transactionCollection.updateOne({
        tradeId: transaction.tradeId,
        account: accountId,
        owner: process.env.BYBIT_OWNER,
    }, {
        $set: {
            src: "ByBit",
            amount: parseFloat(transaction.change),
            timestamp: DateTime.fromMillis(parseInt(transaction.transactionTime)).toISO()
        }
    }, {
        upsert: true
    });
}

async function processTransfer(transfer: TransactionLogV5, accountId: string) {
    const transactionCollection = db.collection('transaction');

    let description = "Deposit";
    if (transfer.type == "TRANSFER_OUT") {
        description = "Withdrawal";
    }

    transactionCollection.updateOne({
        externalId: transfer.transactionTime,
        account: accountId
    }, {
        $set: {
            src: "ByBit",
            owner: process.env.BYBIT_OWNER,
            externalId: transfer.transactionTime,
            account: accountId,
            amount: parseFloat(transfer.change),
            description: description,
            timestamp: DateTime.fromMillis(parseInt(transfer.transactionTime)).toISO()
        }
    }, {
        upsert: true
    });
}

async function processSpotTrade(trade: TransactionLogV5, accountId: string, currency: string = 'USDT') {
    if (currency == trade.currency) return true;

    const transactionCollection = db.collection('transaction');
    const tradeCollection = db.collection('trade');
    const holdingCollection = db.collection('holding');

    let holdingId = "";
    const holding = await holdingCollection.findOne({
        owner: process.env.BYBIT_OWNER,
        ticker: trade.currency,
        type: "Crypto"
    });
    if (!holding) {
        const result = await holdingCollection.insertOne({
            owner: process.env.BYBIT_OWNER,
            ticker: trade.currency,
            contract: trade.symbol,
            type: "Crypto",
            currency: "USDT",
            risk: 6
        });
        if (!result) return false;
        holdingId = result.insertedId.toString();
    } else {
        holdingId = holding._id.toString();
    }
    if (holdingId == "") return true;

    if (orderIds.hasOwnProperty(trade.orderId)) {
        orderIds[trade.orderId] = orderIds[trade.orderId] + 1;
    } else {
        orderIds[trade.orderId] = 1;
    }
    const orderId = trade.orderId + "-" + orderIds[trade.orderId];

    const tradeResult = await tradeCollection.updateOne({
        externalId: orderId,
        account: process.env.BYBIT_ACCOUNT
    }, {
        $set: {
            src: "ByBit",
            owner: process.env.BYBIT_OWNER,
            externalId: orderId,
            account: accountId,
            holding: holdingId,
            orderId: trade.orderId,
            tradeId: trade.tradeId,
            quantity: Math.abs(parseFloat(trade.qty)),
            price: parseFloat(trade.tradePrice),
            qtyFees: parseFloat(trade.fee),
            fees: 0,
            type: trade.side == "Buy" ? "BUY" : "SELL",
            timestamp: DateTime.fromMillis(parseInt(trade.transactionTime)).toISO()
        }
    }, {
        upsert: true
    });

    if (!tradeResult) return false;

    let tradeId = "";
    if (tradeResult.upsertedId) {
        tradeId = tradeResult.upsertedId.toString();
    } else {
        const t = await tradeCollection.findOne({
            externalId: orderId,
            account: process.env.BYBIT_ACCOUNT
        });
        if (t) {
            tradeId = t._id.toString();
        }
    }

    const transactionResult = await transactionCollection.updateOne({
        tradeId: trade.tradeId,
        account: accountId,
        owner: process.env.BYBIT_OWNER
    }, {
        $set: {
            src: "ByBit",
            trade: tradeId,
            description: `${trade.side} ${trade.qty} x ${trade.currency} @ ${trade.tradePrice}`,
            timestamp: DateTime.fromMillis(parseInt(trade.transactionTime)).toISO()
        }
    }, {
        upsert: true
    });

    return true;
}

async function processDerivativeTrade(trade: TransactionLogV5, accountId: string) {
    const transactionCollection = db.collection('transaction');

    const transactionResult = await transactionCollection.updateOne({
        externalId: trade.tradeId,
        account: process.env.BYBIT_ACCOUNT
    }, {
        $set: {
            type: "Crypto Derivative Trade",
            owner: process.env.BYBIT_OWNER,
            externalId: trade.tradeId,
            account: process.env.BYBIT_ACCOUNT,
            amount: parseFloat(trade.change),
            fees: parseFloat(trade.fee),
            description: `${trade.side} ${trade.qty} x ${trade.symbol} Derivative Trade`,
            timestamp: DateTime.fromMillis(parseInt(trade.transactionTime)).toISO()
        }
    }, {
        upsert: true
    });
}

async function processOtherTransaction(transaction: TransactionLogV5, accountId: string) {
    const transactionCollection = db.collection('transaction');

    const transactionResult = await transactionCollection.updateOne({
        externalId: transaction.transactionTime,
        account: process.env.BYBIT_ACCOUNT
    }, {
        $set: {
            src: "ByBit",
            owner: process.env.BYBIT_OWNER,
            externalId: transaction.transactionTime,
            account: process.env.BYBIT_ACCOUNT,
            amount: parseFloat(transaction.change),
            description: `${transaction.type} ${transaction.symbol}`,
            timestamp: DateTime.fromMillis(parseInt(transaction.transactionTime)).toISO()
        }
    }, {
        upsert: true
    });

    if (!transactionResult) return false;
    return true;
}