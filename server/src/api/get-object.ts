import { ObjectId } from "mongodb";
import db from "../lib/mongo";

export default function getObject(data: { owner: string, type: string, id: string }): Promise<Object> {
    const type = data.type;
    const id = data.id;

    return new Promise(async (resolve, reject) => {
        if (!type) {
            reject('Type is required');
        }

        if (!id) {
            reject('ID is required');
        }

        const collection = db.collection(type);
        const result = await collection.findOne({
            _id: new ObjectId(id),
            owner: data.owner
        });

        if (!result) {
            reject('Not found');
            return;
        }
        resolve(result);
    });
}