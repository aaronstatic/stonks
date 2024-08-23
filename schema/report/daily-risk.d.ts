export type DailyRiskReport = {
    days: DailyRisk[]
}

export type DailyRisk = {
    date: string
    risk: number
}