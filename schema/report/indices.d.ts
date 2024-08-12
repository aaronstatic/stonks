export type IndicesReport = {
    [index: string]: {
        value: number;
        change: number;
        changePercent: number;
        gamma: number;
    }
}