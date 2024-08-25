import { Candle } from "@schema/report/candles";
import ATR from "./ATR";
import { DateTime } from "luxon";

type HawkesResult = {
    hawkes: number,
    quantile95: number,
    quantile05: number
}

function hawkesProcess(current: number, previous: number, kappa: number): number {
    const alpha = Math.exp(-kappa);
    return previous * alpha + current;
}

export default function HawkesVolatility(candles: Candle[], kappa: number, atrLength: number, quantileLength: number): HawkesResult[] {
    const results: HawkesResult[] = [];

    if (candles.length < atrLength) {
        return results;
    }
    if (candles.length < quantileLength) {
        return results;
    }

    for (let i = atrLength; i < candles.length; i++) {
        const atr = ATR(candles.slice(i - atrLength, i), atrLength);
        const atrValue = atr[atr.length - 1];
        const candle = candles[i];

        const normRange = (candles[i].high - candles[i].low) / atrValue;

        let hawkes = normRange;
        if (results.length > 0) {
            hawkes = hawkesProcess(normRange, results[results.length - 1].hawkes, kappa);
        }

        let quantile95 = 0;
        let quantile05 = 0;

        if (results.length >= quantileLength) {
            const quantiles: number[] = [];
            for (let j = results.length - quantileLength; j < results.length; j++) {
                quantiles.push(results[j].hawkes);
            }
            quantiles.sort((a, b) => a - b);
            quantile95 = quantiles[Math.floor(quantiles.length * 0.95)];
            quantile05 = quantiles[Math.floor(quantiles.length * 0.05)];
        }

        results.push({
            hawkes,
            quantile95,
            quantile05
        });
    }


    return results;
}