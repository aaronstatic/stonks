import { getCryptoDayCandle } from "../lib/crypto";
import { getIndexDayChangeCandle } from "../lib/indices";
import { getNextExpiryGammaZone, getStockDayChangeCandle } from "../lib/stocks";
import { indices } from "../task/update-indices";
import { IndicesReport } from "@schema/report/indices";

export async function indicesReport(): Promise<IndicesReport> {
    const report: IndicesReport = {};

    for (const indexName of indices) {
        let candles = await getStockDayChangeCandle(indexName);
        let gamma = null;
        let type = "Stock";
        if (!candles) {
            if (indexName === "BTC") {
                const candle = await getCryptoDayCandle(indexName);
                candles = {
                    today: {
                        close: candle.close,
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        volume: candle.volume,
                        timestamp: candle.timestamp
                    },
                    yesterday: {
                        close: candle.open,
                        open: candle.open,
                        high: candle.open,
                        low: candle.open,
                        volume: 0,
                        timestamp: candle.timestamp
                    }
                }
                type = "Crypto";
            } else {
                candles = await getIndexDayChangeCandle(indexName);
                type = "Index";
            }
        } else {
            gamma = await getNextExpiryGammaZone(indexName);
        }
        if (!candles) {
            report[indexName] = {
                gamma: 0,
                value: 0,
                change: 0,
                changePercent: 0,
                type: type
            }
            continue;
        }

        report[indexName] = {
            type: type,
            gamma: gamma || 0,
            value: candles.today.close,
            change: candles.today.close - candles.yesterday.close,
            changePercent: (candles.today.close - candles.yesterday.close) / candles.yesterday.close * 100
        }
    }

    return report;
}