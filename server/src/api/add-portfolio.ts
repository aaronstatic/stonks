import { ObjectId } from "mongodb";
import db from "../lib/mongo";

export default function addPortfolio(data: { owner: string, name: string }): Promise<{ name: string, _id: string }> {
    const { owner, name } = data;
    return new Promise(async (resolve, reject) => {
        const collection = db.collection('portfolio');

        const result = await collection.insertOne({
            owner,
            name
        });

        resolve({ _id: result.insertedId.toString(), name: name });
    });
}