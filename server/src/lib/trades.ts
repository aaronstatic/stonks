import OptionTrade from "@schema/optiontrade";
import Trade from "@schema/trade";
import { WithId } from "mongodb";

export function castAsTrade(doc: any): Trade {
    return {
        _id: doc._id.toString(),
        account: doc.account as string,
        type: doc.type as string,
        holding: doc.holding as string,
        transaction: doc.transaction as string,
        quantity: doc.quantity as number,
        price: doc.price as number,
        fees: doc.fees as number,
        qtyFees: doc.qtyFees as number,
        balance: 0,
        timestamp: doc.timestamp as string,
        owner: doc.owner as string,
        name: doc.name as string,
        holdingType: ""
    };
}

export function castAsOptionTrade(doc: any): OptionTrade {
    return {
        _id: doc._id.toString(),
        account: doc.account as string,
        option: doc.option as string,
        type: doc.type as string,
        quantity: doc.quantity as number,
        price: doc.price as number,
        fees: doc.fees as number,
        timestamp: doc.timestamp as string,
        transaction: doc.transaction as string,
        owner: doc.owner as string,
        name: doc.name as string,
        balance: 0,
        multi: doc.multi as string
    };
}