export type DailyProfitLossReport = {
    days: DailyProfitLoss[]
}

export type DailyProfitLoss = {
    date: string
    profitloss: number
}