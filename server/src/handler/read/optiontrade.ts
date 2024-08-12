import OptionTrade from "@schema/optiontrade";
import Object from "@schema/object";
import { DateTime } from "luxon";

export default async function optionTradeRead(objects: Object[]): Promise<Object[]> {
    let balance = 0;

    objects.sort((a, b) => {
        const A = a as OptionTrade;
        const B = b as OptionTrade;
        const dateA = DateTime.fromISO(A.timestamp);
        const dateB = DateTime.fromISO(B.timestamp);
        return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });

    return objects.map((object) => {
        const trade = object as OptionTrade;
        if (trade.type === 'BUY') {
            balance += trade.quantity;
        } else {
            balance -= trade.quantity
        }
        trade.balance = balance;
        return trade;
    })
}