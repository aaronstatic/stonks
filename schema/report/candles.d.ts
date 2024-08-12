export type Candle = {
    timestamp: string
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export type CandleReport = {
    ticker: string
    candles: Candle[]
}