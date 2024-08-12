import { Filter } from 'mongodb';
import db from '../lib/mongo';
import { ReadMap } from "../handler/map";
import Object from '@schema/object';

export default function getObjects(data: { owner: string, type: string }): Promise<any[]> {
    const type = data.type;

    return new Promise(async (resolve, reject) => {
        if (!type) {
            reject('Type is required');
        }

        const collection = db.collection(type);
        const objects = await collection.find({
            owner: data.owner
        }).toArray();

        if (ReadMap[type]) {
            resolve(await ReadMap[type](objects));
            return;
        }

        resolve(objects);
    });


}