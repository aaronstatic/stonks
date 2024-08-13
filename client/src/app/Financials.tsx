import { useEffect, useState } from "react";
import { FinancialsReport } from "@schema/report/financials";
import { Loader, Stack, Table } from "rsuite";
import Server from "../lib/Server";
import { Stat, StatLabel, Stats, StatValue } from "../report/component/Stats";
import styled from "styled-components";
import { formatLargeNumber } from "../util/format";
import ReactApexChart from "react-apexcharts";
import { DateTime } from "luxon";

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

    const eps = [];
    const netIncome = [];

    for (const item of financials.time_series) {
        let basicEPS = 0;
        let net = 0;
        if (item.basicEPS) {
            basicEPS = item.basicEPS;
        } else {
            if (eps.length > 0) {
                basicEPS = eps[eps.length - 1].y;
            }
        }
        if (item.netIncome) {
            net = item.netIncome;
        } else {
            if (netIncome.length > 0) {
                net = netIncome[netIncome.length - 1].y;
            }
        }
        eps.push({
            x: DateTime.fromISO(item.date).toUTC().minus({ days: 1 }).toFormat("Qq yyyy"),
            y: basicEPS,
            fillColor: basicEPS > 0 ? "#58b15bff" : "#f04f43ff"
        });
        netIncome.push({
            x: DateTime.fromISO(item.date).toUTC().minus({ days: 1 }).toFormat("Qq yyyy"),
            y: net,
            fillColor: net > 0 ? "#58b15bff" : "#f04f43ff"
        });
    }


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
                        <StatLabel>EPS (YoY)</StatLabel>
                        <StatValue>{financials.financials.income_statement.basic_earnings_per_share.value.toFixed(2)} {financials.financials.income_statement.basic_earnings_per_share.unit}</StatValue>
                    </FinancialsStat>
                )}
                {financials.financials.income_statement && financials.financials.income_statement.net_income_loss && (
                    <FinancialsStat>
                        <StatLabel>Net Income (YoY)</StatLabel>
                        <StatValue>{formatLargeNumber(financials.financials.income_statement.net_income_loss.value)} {financials.financials.income_statement.net_income_loss.unit}</StatValue>
                    </FinancialsStat>
                )}
            </FinancialsStats>
            {financials.time_series.length > 0 && (
                <>
                    <Stack>
                        <Stack.Item grow={1}>
                            <ReactApexChart
                                options={{
                                    title: {
                                        text: "EPS (QoQ)",
                                        align: "center"
                                    },
                                    theme: {
                                        mode: "dark"
                                    },
                                    chart: {
                                        toolbar: {
                                            show: false
                                        },
                                        background: "transparent",
                                        foreColor: "#666",
                                        type: "bar",
                                        height: 250
                                    },
                                    grid: {
                                        borderColor: "#333"
                                    },
                                    dataLabels: {
                                        enabled: false
                                    },
                                    yaxis: {
                                        labels: {
                                            formatter: (value) => {
                                                return "$" + value.toFixed(2);
                                            }
                                        }
                                    }
                                }}
                                series={[
                                    {
                                        name: 'EPS',
                                        data: eps
                                    }
                                ]}
                                type="bar"
                                height={250}
                            />
                        </Stack.Item>
                        <Stack.Item grow={1}>
                            <ReactApexChart
                                options={{
                                    title: {
                                        text: "Net Income (QoQ)",
                                        align: "center"
                                    },
                                    theme: {
                                        mode: "dark"
                                    },
                                    chart: {
                                        toolbar: {
                                            show: false
                                        },
                                        background: "transparent",
                                        foreColor: "#666",
                                        type: "bar",
                                        height: 250
                                    },
                                    grid: {
                                        borderColor: "#333"
                                    },
                                    dataLabels: {
                                        enabled: false
                                    },
                                    yaxis: {
                                        labels: {
                                            formatter: (value) => {
                                                return "$" + formatLargeNumber(value, 0);
                                            }
                                        }
                                    }
                                }}
                                series={[
                                    {
                                        name: 'Net Income',
                                        data: netIncome
                                    }
                                ]}
                                type="bar"
                                height={250}
                            />
                        </Stack.Item>
                    </Stack>
                </>
            )}
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