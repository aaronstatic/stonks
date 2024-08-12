import { GammaReport } from "@schema/report/gamma";
import db from "../lib/mongo";
import { DateTime } from "luxon";
import { getStockPrice } from "../lib/stocks";

export default async function financialsReport(owner: string = "", params: any = {}): Promise<GammaReport[]> {
    const ticker: string = params.ticker;
    const today = DateTime.now().setZone("UTC").startOf('day').minus({ days: 1 });
    const spotPrice = await getStockPrice(ticker);

    //Get all current and future gamma
    const gammaCollection = db.collection('options-gamma');
    const gamma = await gammaCollection.find({ ticker: ticker }).toArray();

    const gammaReports: GammaReport[] = [];

    for (const doc of gamma) {
        const date = DateTime.fromISO(doc.date);
        if (date < today) continue;
        const report: GammaReport = {
            date: date.toISO() || "",
            ticker: doc.ticker,
            levels: {
                spotPrice: spotPrice,
                callResistance: doc.levels.callResistance,
                putSupport: doc.levels.putSupport,
                gammaFlip: doc.levels.gammaFlip,
            },
            data: doc.data
        }

        gammaReports.push(report);
    }

    return gammaReports;
}