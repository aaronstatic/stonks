import db from "../lib/mongo";
import { ReadMap } from "../handler/map";

export default function queryObjects(data: { owner: string, type: string, query: Object }): Promise<Object[]> {
    const type = data.type;
    const query = data.query;

    return new Promise(async (resolve, reject) => {
        if (!type) {
            reject('Type is required');
        }

        const collection = db.collection(type);
        const results = await collection.find({
            ...query,
            owner: data.owner
        }).toArray();

        if (ReadMap[type]) {
            resolve(await ReadMap[type](results));
            return;
        }

        resolve(results);
    });
}