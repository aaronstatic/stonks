import { ObjectId } from "mongodb";
import db from "../lib/mongo";

export default function getPortfolios(data: { owner: string }): Promise<Object> {
    return new Promise(async (resolve, reject) => {

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
    });
}