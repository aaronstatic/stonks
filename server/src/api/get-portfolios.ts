import { ObjectId } from "mongodb";
import db from "../lib/mongo";

export default function getPortfolios(data: { owner: string }): Promise<Object> {
    return new Promise(async (resolve, reject) => {
        const user = await db.collection('users').findOne({ _id: new ObjectId(data.owner) });
        if (!user) {
            reject("User not found");
            return;
        }
        const caps = user.caps || [];
        if (caps.includes("admin")) {
            const portfolios = [{
                label: "Default portfolio",
                value: "default"
            }]

            const collection = db.collection("portfolio");
            const result = await collection.find({}).toArray();

            const allUsers = await db.collection('users').find({}).toArray();
            for (const user of allUsers) {
                if (user._id.toString() === data.owner) continue;
                portfolios.push({
                    label: `${user.username} - Default`,
                    value: user._id.toString()
                })
            }

            for (const portfolio of result) {
                const portUser = await db.collection('users').findOne({ _id: new ObjectId(portfolio.owner as string) });
                if (portUser) {
                    portfolios.push({
                        label: `${portUser.username} - ${portfolio.name}`,
                        value: portfolio._id.toString()
                    })
                }
            }

            resolve(portfolios);

        } else {

            const portfolios = [{
                label: "Default portfolio",
                value: "default"
            }]

            const collection = db.collection("portfolio");
            const result = await collection.find({
                owner: data.owner
            }).toArray();

            for (const portfolio of result) {
                portfolios.push({
                    label: portfolio.name,
                    value: portfolio._id.toString()
                })
            }

            resolve(portfolios);
        }
    });
}