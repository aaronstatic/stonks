import { ObjectId } from "mongodb";
import db from "./mongo";
import { sortEvent } from "./stocks";
import { getExchangeRate } from "./currency";
import Account from "@schema/account";
import { DateTime } from "luxon";

export function castAccount(account: any): Account {
    return {
        _id: account._id,
        platform: account.platform,
        owner: account.owner,
        name: account.name,
        currency: account.currency,
        balance: account.balance
    };
}

export async function getAccountBalance(accountId: string, toDate: string = ""): Promise<number> {
    const transactionCollection = db.collection('transaction');

    if (toDate == "") {
        toDate = DateTime.now().toUTC().toISO();
    }
    const todayDate = DateTime.fromISO(toDate).setZone("UTC");

    const transactions = await transactionCollection.find({
        account: accountId
    }).toArray();

    transactions.sort(sortEvent);

    let balance = 0;
    for (const transaction of transactions) {
        const transactionDate = DateTime.fromISO(transaction.timestamp).toUTC();
        if (transactionDate > todayDate) {
            break;
        }
        balance += transaction.amount;
    }
    return balance;
}

export async function getTotalAccountBalance(owner: string, toDate: string = "", currency: string = "USD"): Promise<number> {
    const exchangeRates: { [key: string]: number } = {};
    const accountCollection = db.collection('account');

    const accounts = await accountCollection.find({
        owner
    }).toArray();

    let totalBalance = 0;
    for (const account of accounts) {
        const balance = await getAccountBalance(account._id.toString(), toDate);

        if (account.currency != currency) {
            if (!exchangeRates[account.currency]) {
                exchangeRates[account.currency] = await getExchangeRate(account.currency + currency);
            }
            totalBalance += balance * exchangeRates[account.currency];
        } else {
            totalBalance += balance
        }
    }

    return totalBalance;
}

export async function getAllAccounts(owner: string, toDate: string = ""): Promise<Account[]> {
    const accountCollection = db.collection('account');

    const accounts = await accountCollection.find({
        owner
    }).toArray();

    const list: Account[] = [];

    for (const doc of accounts) {
        const account = castAccount(doc);
        account.balance = await getAccountBalance(account._id.toString(), toDate);
        list.push(account);
    }

    return list;
}