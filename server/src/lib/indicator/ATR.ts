import { Candle } from "@schema/report/candles";
import RMA from "./RMA";

// Function ATR (average true range) returns the RMA of true range. True range is max(high - low, abs(high - close[1]), abs(low - close[1])).
// https://www.tradingview.com/pine-script-reference/v5/#fun_ta.atr
export default function ATR(candles: Candle[], length: number): number[] {
    const trueRange: number[] = [];

    for (let i = 0; i < candles.length; i++) {
        const currentHigh = candles[i].high;
        const currentLow = candles[i].low;
        const previousClose = i > 0 ? candles[i - 1].close : currentHigh;

        const highLow = currentHigh - currentLow;
        const highClose = Math.abs(currentHigh - previousClose);
        const lowClose = Math.abs(currentLow - previousClose);

        trueRange.push(Math.max(highLow, highClose, lowClose));
    }

    return RMA(trueRange, length);
}
