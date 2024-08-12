import db from "../lib/mongo";
import { ReadMap } from "../handler/map";

export default function queryDatabase(data: { owner: string, collection: string, query: Object }): Promise<Object[]> {
    const collection = data.collection;
    const query = data.query;

    return new Promise(async (resolve, reject) => {
        if (!collection) {
            reject('Collection is required');
        }

        const coll = db.collection(collection);
        const results = await coll.find(query).toArray();

        if (ReadMap[collection]) {
            resolve(await ReadMap[collection](results));
            return;
        }

        resolve(results);
    });
}