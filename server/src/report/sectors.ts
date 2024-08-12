import { getLatestStockCandle, getStockDayChangeCandle, getStockDetails } from "../lib/stocks";
import { sectorFunds } from "../task/update-stocks";
import { Sector } from "@schema/report/sectors";

export async function sectors(): Promise<Sector[]> {
    const report = [];

    for (const ticker of sectorFunds) {
        const candles = await getStockDayChangeCandle(ticker);
        if (!candles) continue;
        const details = await getStockDetails(ticker);
        let name = ticker;
        if (details) name = details.name;
        report.push({
            name: name,
            ticker: ticker,
            value: candles.today.close,
            change: candles.today.close - candles.yesterday.close,
            changePercent: (candles.today.close - candles.yesterday.close) / candles.yesterday.close * 100
        })
    }

    return report;
}