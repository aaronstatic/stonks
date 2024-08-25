import { Candle } from "@schema/report/candles";

export default function EMA(values: number[], length: number): number[] {
    if (values.length < length) {
        return [values[0]];
    }
    const ema: number[] = [];

    let sum = 0;
    for (let i = 0; i < length; i++) {
        sum += values[i];
    }

    ema.push(sum / length);

    for (let i = length; i < values.length; i++) {
        sum = sum - values[i - length] + values[i];
        const sma = sum / length;
        const multiplier = 2 / (length + 1);
        ema.push((values[i] - sma) * multiplier + sma);
    }

    return ema;
}