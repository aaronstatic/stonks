import Holding from "@schema/holding";
import db from "./mongo";
import { ObjectId } from "mongodb";

export function castHolding(doc: any): Holding {
    return {
        _id: doc._id.toString(),
        ticker: doc.ticker as string,
        owner: doc.owner as string,
        name: doc.name as string,
        risk: parseFloat(doc.risk) as number,
        type: doc.type as string,
        contract: doc.contract as string,
        currency: doc.currency as string
    };
}

export function getHolding(id: string): Promise<Holding> {
    return db.collection('holding').findOne({ _id: new ObjectId(id) }).then(castHolding);
}

export async function getAllHoldings(owner: string): Promise<Holding[]> {
    return await db.collection('holding').find({ owner }).map(castHolding).toArray();
}

export async function getHoldingByTicker(owner: string, ticker: string): Promise<Holding | null> {
    const holding = await db.collection('holding').findOne({ owner, ticker });
    if (!holding) {
        return null;
    }
    return castHolding(holding);
}