import RMA from "./RMA";

export default function RSI(values: number[], length: number): number[] {
    if (values.length < length) {
        return [50];
    }
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < values.length; i++) {
        const change = values[i] - values[i - 1];
        gains.push(Math.max(change, 0));
        losses.push(Math.max(-change, 0));
    }

    const averageGains = RMA(gains, length);
    const averageLosses = RMA(losses, length);

    for (let i = 0; i < averageGains.length; i++) {
        const rs = averageGains[i] / averageLosses[i];
        const rsiValue = 100 - 100 / (1 + rs);
        rsi.push(rsiValue);
    }

    return rsi;
}