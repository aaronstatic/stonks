export type HoldingReport = {
    ticker: string
    name: string
    type: string
    risk: number
    unrealized: number
    realized: number
    realizedfy: number
    openQuantity: number
    averageOpenPrice: number
    value: number
    today: number
    currency: string
    id: string
    lastPrice: number
    cost: number
    nextEarnings: string
    nextEarningsTime: string
    lastDividend: string
    lastDividendAmount: number
    nextDividend: string
    nextDividendAmount: number
    gamma: number
}