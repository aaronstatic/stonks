import Trade from "@schema/trade";
import Object from "@schema/object";
import { DateTime } from "luxon";
import Holding from "@schema/holding";
import { getHolding } from "../../lib/holdings";

export default async function tradeRead(objects: Object[]): Promise<Object[]> {
    let balance = 0;

    objects.sort((a, b) => {
        const A = a as Trade;
        const B = b as Trade;
        const dateA = DateTime.fromISO(A.timestamp);
        const dateB = DateTime.fromISO(B.timestamp);
        return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });

    const balances: { [key: string]: number } = {};
    const holdings: { [key: string]: Holding } = {};

    for (let object of objects) {
        const trade = object as Trade;
        if (!holdings[trade.holding]) {
            holdings[trade.holding] = await getHolding(trade.holding);
        }
        trade.holdingData = holdings[trade.holding];
        if (trade.type === 'BUY') {
            balances[trade.holding] = (balances[trade.holding] || 0) + trade.quantity - (trade.qtyFees || 0);
        } else {
            balances[trade.holding] -= trade.quantity
        }
        trade.balance = balances[trade.holding];
    }
    return objects;
}