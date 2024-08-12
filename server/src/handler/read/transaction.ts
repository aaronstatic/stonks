import Transaction from "@schema/transaction";
import Object from "@schema/object";
import { DateTime } from "luxon";

export default async function transactionRead(objects: Object[]): Promise<Object[]> {
    let balance = 0;

    objects.sort((a, b) => {
        const A = a as Transaction;
        const B = b as Transaction;
        const dateA = DateTime.fromISO(A.timestamp);
        const dateB = DateTime.fromISO(B.timestamp);
        return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });

    return objects.map((object) => {
        const transaction = object as Transaction;
        if (transaction.amount)
            balance += transaction.amount;
        transaction.balance = balance;
        return transaction;
    })
}