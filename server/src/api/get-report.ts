import candleReport from "../report/candles";
import dailyProfitLoss from "../report/daily-profitloss";
import financialsReport from "../report/financials";
import holdingReport from "../report/holding";
import { indicesReport } from "../report/indices";
import dashboard from "../report/dashboard";
import { sectors } from "../report/sectors";
import watchlist from "../report/watchlist";
import dailyValue from "../report/daily-value";
import gamma from "../report/gamma";

type ReportMap = {
    [key: string]: (owner: string, params: any) => Promise<any>
}

const reportMap: ReportMap = {
    'dashboard': dashboard,
    'candles': candleReport,
    'holding': holdingReport,
    'daily-profitloss': dailyProfitLoss,
    'daily-value': dailyValue,
    'financials': financialsReport,
    'watchlist': watchlist,
    'indices': indicesReport,
    'sectors': sectors,
    'gamma': gamma
}

export default function getReport(data: { owner: string, type: string, params: any }): Promise<Object> {
    const type = data.type;
    const params = data.params;

    console.log(`Getting report for ${type}`);

    return new Promise(async (resolve, reject) => {
        if (!type) {
            reject('Type is required');
        }

        if (reportMap[type]) {
            try {
                resolve(await reportMap[type](data.owner, params));
            } catch (e) {
                console.error(e);
                reject(e);
            }
            return;
        } else {
            console.warn(`Report type ${type} not found`);
            reject(`Report type ${type} not found`);
        }
    });
}