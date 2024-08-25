export default function RMA(values: number[], length: number): number[] {
    const result: number[] = [];
    let sum = 0;

    for (let i = 0; i < values.length; i++) {
        if (i < length) {
            sum += values[i];
            if (i === length - 1) {
                result.push(sum / length);
            }
        } else {
            const rma = (result[result.length - 1] * (length - 1) + values[i]) / length;
            result.push(rma);
        }
    }

    return result;
}