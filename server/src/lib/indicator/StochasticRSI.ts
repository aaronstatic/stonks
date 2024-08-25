import { Candle } from "@schema/report/candles";
import RSI from "./RSI";
import SMA from "./SMA";

type StochasticRSIResult = {
    k: number,
    d: number
}

// Stochastic. It is calculated by a formula: 100 * (close - lowest(low, length)) / (highest(high, length) - lowest(low, length)).
// https://www.tradingview.com/pine-script-reference/v5/#fun_ta.stoch
export default function StochasticRSI(values: number[], smoothK: number, smoothD: number, rsiLength: number, stochLength: number): StochasticRSIResult[] {
    if (values.length < rsiLength || values.length < stochLength) {
        return [{
            k: 0,
            d: 0
        }];
    }
    const rsi: number[] = RSI(values, rsiLength);
    const k: number[] = [];

    for (let i = stochLength; i < rsi.length; i++) {
        const rsiValue = rsi[i];
        const rsiHigh = Math.max(...rsi.slice(i - stochLength, i));
        const rsiLow = Math.min(...rsi.slice(i - stochLength, i));

        let kValue = 100 * (rsiValue - rsiLow) / (rsiHigh - rsiLow);
        if (kValue < 0) {
            kValue = 0;
        }
        if (kValue > 100) {
            kValue = 100;
        }

        k.push(kValue);
    }

    const results: StochasticRSIResult[] = [];
    const smoothedK = SMA(k, smoothK);
    const smoothedD = SMA(smoothedK, smoothD);

    for (let i = smoothD - 1; i < smoothedK.length; i++) {
        results.push({
            k: smoothedK[i],
            d: smoothedD[i - smoothD + 1]
        });
    }


    return results;
}