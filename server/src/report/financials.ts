import { FinancialsReport } from "@schema/report/financials";
import db from "../lib/mongo";
import { calculateDCF } from "../lib/dcf";

export default async function financialsReport(owner: string = "", params: any = {}): Promise<FinancialsReport | null> {
    const ticker: string = params.ticker;

    const financials = await db.collection('stocks-financials').findOne({ ticker: ticker });

    if (!financials) return null;

    const discountRate = 0.15;
    const growthRate = 0.05;
    const period = 10;
    let intrinsic_value = 0;

    if (financials.financials && financials.financials.cash_flow_statement && financials.financials.cash_flow_statement.net_cash_flow_from_operating_activities) {
        const netCashFlow = financials.financials.cash_flow_statement.net_cash_flow_from_operating_activities.value;
        intrinsic_value = calculateDCF(netCashFlow, discountRate, growthRate, period);
    }

    return {
        intrinsic_value: intrinsic_value,
        company_name: financials.company_name,
        start_date: financials.start_date,
        end_date: financials.end_date,
        fiscal_period: financials.fiscal_period,
        fiscal_year: financials.fiscal_year,
        lastUpdate: financials.lastUpdate,
        sic: financials.sic,
        tickers: financials.tickers,
        timeframe: financials.timeframe,
        ticker: financials.ticker,
        financials: {
            cash_flow_statement: financials.financials.cash_flow_statement,
            balance_sheet: financials.financials.balance_sheet,
            income_statement: financials.financials.income_statement,
            comprehensive_income: financials.financials.comprehensive_income
        }
    };
}