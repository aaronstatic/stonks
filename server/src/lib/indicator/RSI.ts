import { Candle } from "@schema/report/candles";

export default function RSI(candles: Candle[], length: number): number[] {
    if (candles.length < length) {
        return [50];
    }
    const rsi: number[] = [];

    let gain = 0;
    let loss = 0;

    for (let i = 1; i < length; i++) {
        const diff = candles[i].close - candles[i - 1].close;
        if (diff > 0) {
            gain += diff;
        } else {
            loss -= diff;
        }
    }

    let avgGain = gain / length;
    let avgLoss = loss / length;

    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));

    for (let i = length; i < candles.length; i++) {
        const diff = candles[i].close - candles[i - 1].close;
        if (diff > 0) {
            avgGain = (avgGain * (length - 1) + diff) / length;
            avgLoss = (avgLoss * (length - 1)) / length;
        } else {
            avgGain = (avgGain * (length - 1)) / length;
            avgLoss = (avgLoss * (length - 1) - diff) / length;
        }

        rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
    }

    return rsi;
}