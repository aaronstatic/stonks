type FinancialsSection = {
    value: number
    unit: string
    label: string
    order: number
}

export type FinancialsReport = {
    company_name: string
    ticker: string
    end_date: string
    intrinsic_value: number
    time_series: [{
        [key: string]: any
    }]
    financials: {
        cash_flow_statement: {
            [key: string]: FinancialsSection
        },
        balance_sheet: {
            [key: string]: FinancialsSection
        },
        income_statement: {
            [key: string]: FinancialsSection
        },
        comprehensive_income: {
            [key: string]: FinancialsSection
        }
    },
    fiscal_period: string
    fiscal_year: string
    lastUpdate: string
    sic: string
    start_date: string
    tickers: string[]
    timeframe: string
}