import { ObjectId } from 'mongodb';
import db from '../lib/mongo';
import { BeforeWriteMap, AfterWriteMap } from '../handler/map';
import Object from '@schema/object';

export default function updateObject(data: { owner: string, type: string, id: string, object: Object }): Promise<Object> {
    const type = data.type;
    let doc = data.object;
    const id = data.id;

    return new Promise(async (resolve, reject) => {
        if (!type) {
            reject('Type is required');
        }

        if (!id) {
            reject('ID is required');
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
        let update: {
            [key: string]: any;
        } = {
            ...doc
        };
        delete update._id;

        const result = await collection.updateOne({
            _id: new ObjectId(id),
            owner: data.owner
        }, {
            $set: update
        });
        update._id = id;

        if (AfterWriteMap[type]) {
            try {
                update = await AfterWriteMap[type](update);
            } catch (e) {
                reject(e);
                return;
            }
        }
        if (result.modifiedCount === 0) {
            reject('Not found');
            return;
        }
        resolve(update as Object);
    });


}