import Account from '@schema/account'
import { HoldingReport } from './holding'

export type DashboardReport = {
    mainCurrency: string
    holdings: HoldingReport[]
    accounts: Account[]
    risk: number
    unrealized: number
    realizedfy: number
    totalValue: number
    today: number
    distribution: {
        [key: string]: number
    }
}