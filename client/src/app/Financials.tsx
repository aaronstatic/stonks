import { useEffect, useState } from "react";
import { FinancialsReport } from "@schema/report/financials";
import { Loader, Table } from "rsuite";
import Server from "../lib/Server";
import { Stat, StatLabel, Stats, StatValue } from "../report/component/Stats";
import styled from "styled-components";
import { formatLargeNumber } from "../util/format";

const SectionHeader = styled.h3`
    margin-bottom: 10px;
    display: block;
    padding: 10px;
    background-color: var(--rs-gray-700);
    font-size: 1.2rem;
    line-height: 1.5rem;
`
const CompanyName = styled.h4`
    margin-bottom: 10px;
`

const FinancialsStats = styled(Stats)`
    margin-bottom: 10px;
`

const FinancialsStat = styled(Stat)`
    background-color: var(--rs-gray-700);
`

function FinancialsTable({ data }: { data: { label: string, value: number, unit: string }[] }) {
    return (
        <Table data={data} autoHeight>
            <Table.Column flexGrow={1}>
                <Table.HeaderCell>
                    Label
                </Table.HeaderCell>
                <Table.Cell dataKey="label" />
            </Table.Column>
            <Table.Column flexGrow={1}>
                <Table.HeaderCell>
                    Value
                </Table.HeaderCell>
                <Table.Cell>
                    {(rowData: { label: string, value: number, unit: string }) => {
                        return <>{formatLargeNumber(rowData.value)} {rowData.unit}</>
                    }}
                </Table.Cell>
            </Table.Column>
        </Table>
    )
}

export default function Financials({ ticker, tickerDetails }: { ticker: string, tickerDetails: any }) {
    const [financials, setFinancials] = useState<FinancialsReport | null>(null);

    useEffect(() => {
        Server.getReport('financials', { ticker }).then(setFinancials);
    }, []);

    if (!financials) return <Loader center />;

    //Cash flow    
    const cashFlow = [];
    for (const key in financials.financials.cash_flow_statement) {
        const item = financials.financials.cash_flow_statement[key];
        cashFlow.push({
            label: item.label,
            value: item.value,
            unit: item.unit,
            order: item.order
        });
    }
    cashFlow.sort((a, b) => a.order - b.order);

    //Balance sheet
    const balanceSheet = [];
    for (const key in financials.financials.balance_sheet) {
        const item = financials.financials.balance_sheet[key];
        balanceSheet.push({
            label: item.label,
            value: item.value,
            unit: item.unit,
            order: item.order
        });
    }
    balanceSheet.sort((a, b) => a.order - b.order);

    //Income statement
    const incomeStatement = [];
    for (const key in financials.financials.income_statement) {
        const item = financials.financials.income_statement[key];
        incomeStatement.push({
            label: item.label,
            value: item.value,
            unit: item.unit,
            order: item.order
        });
    }
    incomeStatement.sort((a, b) => a.order - b.order);

    //Comprehensive income
    const comprehensiveIncome = [];
    for (const key in financials.financials.comprehensive_income) {
        const item = financials.financials.comprehensive_income[key];
        comprehensiveIncome.push({
            label: item.label,
            value: item.value,
            unit: item.unit,
            order: item.order
        });
    }
    comprehensiveIncome.sort((a, b) => a.order - b.order);

    return (
        <>
            <CompanyName>[{ticker}] {financials.company_name}</CompanyName>
            <FinancialsStats>
                <FinancialsStat>
                    <StatLabel>Start Date</StatLabel>
                    <StatValue>{financials.start_date}</StatValue>
                </FinancialsStat>
                <FinancialsStat>
                    <StatLabel>End Date</StatLabel>
                    <StatValue>{financials.end_date}</StatValue>
                </FinancialsStat>
                {financials.financials.income_statement && financials.financials.income_statement.basic_earnings_per_share && (
                    <FinancialsStat>
                        <StatLabel>EPS</StatLabel>
                        <StatValue>{financials.financials.income_statement.basic_earnings_per_share.value.toFixed(2)} {financials.financials.income_statement.basic_earnings_per_share.unit}</StatValue>
                    </FinancialsStat>
                )}
                {financials.financials.income_statement && financials.financials.income_statement.net_income_loss && (
                    <FinancialsStat>
                        <StatLabel>Net Income</StatLabel>
                        <StatValue>{formatLargeNumber(financials.financials.income_statement.net_income_loss.value)} {financials.financials.income_statement.net_income_loss.unit}</StatValue>
                    </FinancialsStat>
                )}
                {financials.intrinsic_value > 0 && tickerDetails && tickerDetails.share_class_shares_outstanding && (
                    <FinancialsStat>
                        <StatLabel>Intrinsic Value</StatLabel>
                        <StatValue>{(financials.intrinsic_value / tickerDetails.share_class_shares_outstanding).toFixed(2)} {financials.financials.income_statement.net_income_loss.unit}</StatValue>
                    </FinancialsStat>
                )}
            </FinancialsStats>
            <SectionHeader>Cash Flow</SectionHeader>
            <FinancialsTable data={cashFlow} />
            <SectionHeader>Balance Sheet</SectionHeader>
            <FinancialsTable data={balanceSheet} />
            <SectionHeader>Income Statement</SectionHeader>
            <FinancialsTable data={incomeStatement} />
            <SectionHeader>Comprehensive Income</SectionHeader>
            <FinancialsTable data={comprehensiveIncome} />
        </>
    );
}