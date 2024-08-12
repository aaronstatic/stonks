import { getIndexDayChangeCandle } from "../lib/indices";
import { getNextExpiryGammaZone, getStockDayChangeCandle } from "../lib/stocks";
import { indices } from "../task/update-indices";
import { IndicesReport } from "@schema/report/indices";

export async function indicesReport(): Promise<IndicesReport> {
    const report: IndicesReport = {};

    for (const indexName of indices) {
        let candles = await getIndexDayChangeCandle(indexName);
        let gamma = null;
        if (!candles) {
            candles = await getStockDayChangeCandle(indexName);
            gamma = await getNextExpiryGammaZone(indexName);
        }
        if (!candles) continue;

        report[indexName] = {
            gamma: gamma || 0,
            value: candles.today.close,
            change: candles.today.close - candles.yesterday.close,
            changePercent: (candles.today.close - candles.yesterday.close) / candles.yesterday.close * 100
        }
    }

    return report;
}