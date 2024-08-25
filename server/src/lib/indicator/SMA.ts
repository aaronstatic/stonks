export default function SMA(values: number[], length: number): number[] {
    if (values.length < length) {
        return [values[0]];
    }
    const sma: number[] = [];

    let sum = 0;
    for (let i = 0; i < length; i++) {
        sum += values[i];
    }

    sma.push(sum / length);

    for (let i = length; i < values.length; i++) {
        sum = sum - values[i - length] + values[i];
        sma.push(sum / length);
    }

    return sma;
}