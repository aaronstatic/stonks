import db from '../lib/mongo';
import { BeforeWriteMap, AfterWriteMap } from '../handler/map';

export default function createObject(data: { owner: string, type: string, object: Object }): Promise<Object> {
    const type = data.type;
    let doc = data.object;

    return new Promise(async (resolve, reject) => {
        if (!type) {
            reject('Type is required');
        }

        if (BeforeWriteMap[type]) {
            try {
                doc = await BeforeWriteMap[type](doc);
            } catch (e) {
                reject(e);
                return;
            }
        }

        const collection = db.collection(type);
        let insert: {
            [key: string]: any;
        } = {
            ...doc,
            owner: data.owner
        };
        delete insert._id;

        const result = await collection.insertOne(insert);
        if (!result.insertedId) {
            reject('Failed to insert');
            return;
        }
        if (AfterWriteMap[type]) {
            try {
                insert._id = result.insertedId;
                insert = await AfterWriteMap[type](insert);
            } catch (e) {
                reject(e);
                return;
            }
        }
        resolve({
            _id: result.insertedId,
            ...insert
        });
    });


}