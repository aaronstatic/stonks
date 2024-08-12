import Trade from "@schema/trade";
import Object from "@schema/object";
import { DateTime } from "luxon";

export default async function tradeRead(objects: Object[]): Promise<Object[]> {
    let balance = 0;

    objects.sort((a, b) => {
        const A = a as Trade;
        const B = b as Trade;
        const dateA = DateTime.fromISO(A.timestamp);
        const dateB = DateTime.fromISO(B.timestamp);
        return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });

    return objects.map((object) => {
        const trade = object as Trade;
        if (trade.type === 'BUY') {
            balance += trade.quantity - (trade.qtyFees || 0);
        } else {
            balance -= trade.quantity
        }
        trade.balance = balance;
        return trade;
    })
}