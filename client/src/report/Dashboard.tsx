import { DashboardReport } from '@schema/report/dashboard';
import { IndicesReport } from '@schema/report/indices';
import { HoldingReport } from '@schema/report/holding';
import { Sector } from '@schema/report/sectors';
import { useContext, useEffect, useState } from 'react';
import Server from '../lib/Server';
import { Loader, Panel, Table, Tabs } from 'rsuite';
import styled from 'styled-components';
import Chart from 'react-apexcharts';

import { SmallStats, Stats, Stat, StatLabel, StatValue, StatSubValue, StatGamma } from './component/Stats';
import { DateTime } from 'luxon';
import { UserData } from '../App';
import DailyProfitLoss from './DailyProfitLoss';
import DailyValue from './DailyValue';

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 5px;    
`;

const ChartWrapper = styled.div`
    padding: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
    .apexcharts-legend-text {
        color: var(--rs-gray-100) !important;
    }
    @media (max-width: 900px) {
        height: 200px;
        text {
            font-size: 0.7em;
        }
    }
`;

const TableWrapper = styled.div`
    @media (max-width: 900px) {
        font-size: 0.8em;
    }
`;

//format as grouped thousands, ignore decimals
function thousands(n: string): string {
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function HoldingTable({ data, userData, totalValue }: { data: HoldingReport[], userData: any, totalValue: number }) {
    //get viewport width
    const width = window.innerWidth;
    let smallColumnSize = 100;
    let mediumColumnSize = 150;
    let tinyColumnSize = 50;
    if (width < 900) {
        smallColumnSize = 90;
        mediumColumnSize = 115;
        tinyColumnSize = 40;
    }

    return (
        <Table data={data} height={280} onDoubleClick={e => {
            const target = e.target as HTMLElement;
            if (target) {
                const row = target.closest(".rs-table-row");
                if (!row) return;
                const rowNum = row.getAttribute("aria-rowindex");
                const id = data[parseInt(rowNum as string) - 2].id;
                if (!id) return;
                Server.emit("open-object", { type: 'holding', id: id });
            }
        }}>
            <Table.Column width={mediumColumnSize} align="center">
                <Table.HeaderCell>Ticker</Table.HeaderCell>
                <Table.Cell dataKey="ticker" />
            </Table.Column>
            <Table.Column width={mediumColumnSize} align="center">
                <Table.HeaderCell>Unrealized P&L</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => (
                        <span className={rowData.unrealized > 0 ? "green" : "red"}>
                            {thousands(rowData.unrealized.toFixed(2))} {userData.currency} ({((rowData.unrealized / rowData.cost) * 100).toFixed(2)}%)
                        </span>
                    )}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={mediumColumnSize} align="center">
                <Table.HeaderCell>Today</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => (
                        <span className={rowData.today == 0 ? "zero" : rowData.today > 0 ? "green" : "red"}>{thousands(rowData.today.toFixed(2))} {userData.currency} ({((rowData.today / (rowData.averageOpenPrice * rowData.openQuantity)) * 100).toFixed(2)}%)</span>
                    )}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={tinyColumnSize} align="center">
                <Table.HeaderCell>Gamma</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => (
                        <span className={rowData.gamma == 0 ? "zero" : rowData.gamma > 0 ? "green" : "red"}>
                            {rowData.gamma > 0 ? "+γ" : "-γ"}
                        </span>
                    )}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={smallColumnSize} align="center">
                <Table.HeaderCell>Qty</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => {
                        let decimals = 0;
                        if (rowData.type == "Crypto") decimals = 2;
                        return (
                            <span>{thousands(rowData.openQuantity.toFixed(decimals))}</span>
                        )
                    }}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={smallColumnSize} align="center">
                <Table.HeaderCell>Avg Price</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => (
                        <span>{rowData.averageOpenPrice.toFixed(2)} {rowData.currency}</span>
                    )}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={smallColumnSize} align="center">
                <Table.HeaderCell>Last Price</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => (
                        <span>{rowData.lastPrice.toFixed(2)} {rowData.currency}</span>
                    )}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={mediumColumnSize} align="center">
                <Table.HeaderCell>Value</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => (
                        <span>{thousands(rowData.value.toFixed(2))} {userData.currency} ({((rowData.value / totalValue) * 100).toFixed(2)}%)</span>
                    )}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={mediumColumnSize} align="center">
                <Table.HeaderCell>Next Earnings</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => {
                        if (rowData.nextEarnings) {
                            let icon = "light_mode";
                            if (rowData.nextEarningsTime === "amc") {
                                icon = "mode_night";
                            }
                            const date = DateTime.fromISO(rowData.nextEarnings);
                            return <><span className="material-symbols-rounded">
                                {icon}
                            </span> <span>{date.toFormat("ccc d MMM")}</span>
                            </>
                        }
                    }}
                </Table.Cell>
            </Table.Column>
            <Table.Column width={smallColumnSize} align="center">
                <Table.HeaderCell>Last Dividend</Table.HeaderCell>
                <Table.Cell>
                    {(rowData: HoldingReport) => {
                        if (rowData.lastDividend) {
                            return <><span>{(rowData.lastDividendAmount * rowData.openQuantity).toFixed(2)} {rowData.currency}</span></>
                        }
                    }}
                </Table.Cell>
            </Table.Column>
        </Table>
    )
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardReport | null>(null);
    const [indices, setIndices] = useState<IndicesReport | null>(null);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const userData = useContext(UserData);

    useEffect(() => {
        // Fetch data
        Server.getReport('dashboard').then((data) => {
            setData(data as DashboardReport);
        });
        Server.getReport('indices').then((data) => {
            setIndices(data as IndicesReport);
        });
        Server.getReport('sectors').then((data) => {
            data.sort((a: Sector, b: Sector) => b.changePercent - a.changePercent);
            setSectors(data as Sector[]);
        });
    }, []);

    if (!data) return <Loader center size="lg" />;

    const todayPerc = (data.today / data.totalValue * 100);
    const unrealizedPerc = (data.unrealized / data.totalValue * 100);


    //Distribution chart
    const series = [];
    const labels = [];
    for (const key in data.distribution) {
        series.push(data.distribution[key]);
        labels.push(key);
    }

    const stockHoldings = data.holdings.filter(h => h.type === "Stock");
    const bondHoldings = data.holdings.filter(h => h.type === "Bonds");
    const cryptoHoldings = data.holdings.filter(h => h.type === "Crypto");
    const optionHoldings = data.holdings.filter(h => h.type === "Option");

    const indexRow1 = ["SPY", "QQQ", "IWM", "TVC:DJI", "BINANCE:BTCUSD"];
    const indexRow2 = ["CBOE_DLY:VIX", "ICEUS_DLY:DX1!", "TVC:GOLD", "CAPITALCOM:COPPER", "TVC:USOIL"];

    const onClickIndex = (index: string) => {
        Server.emit("open-object", { type: 'index', id: index });
    }

    return (
        <Panel>
            <Wrapper>
                {indices && (
                    <>
                        <SmallStats>
                            {indexRow1.map((index) => {
                                return (
                                    <Stat key={index} onClick={() => { onClickIndex(index) }}>
                                        <StatLabel>{index.includes(":") ? index.split(":")[1] : index}</StatLabel>
                                        <StatValue>{thousands(indices[index].value.toFixed(2))}</StatValue>
                                        <StatSubValue className={indices[index].change > 0 ? "green" : "red"}>{indices[index].changePercent.toFixed(2)}%</StatSubValue>
                                        {indices[index].gamma != 0 && (
                                            <StatGamma value={indices[index].gamma} />
                                        )}
                                    </Stat>
                                )
                            })}
                        </SmallStats>
                        <SmallStats>
                            {indexRow2.map((index) => {
                                return (
                                    <Stat key={index} onClick={() => { onClickIndex(index) }}>
                                        <StatLabel>{index.split(":")[1]}</StatLabel>
                                        <StatValue>{thousands(indices[index].value.toFixed(2))}</StatValue>
                                        <StatSubValue className={indices[index].change > 0 ? "green" : "red"}>{indices[index].changePercent.toFixed(2)}%</StatSubValue>
                                    </Stat>
                                )
                            })}
                        </SmallStats>
                    </>
                )}
                <Stats>
                    <Stat>
                        <StatLabel>Total Value</StatLabel>
                        <StatValue>{thousands(data.totalValue.toFixed(2))} {data.mainCurrency}</StatValue>
                    </Stat>
                    <Stat>
                        <StatLabel>Realized P&L (FY)</StatLabel>
                        <StatValue className={data.realizedfy > 0 ? "green" : "red"}>{thousands(data.realizedfy.toFixed(2))} {data.mainCurrency}</StatValue>

                    </Stat>
                    <Stat>
                        <StatLabel>Unrealized P&L</StatLabel>
                        <StatValue className={data.unrealized > 0 ? "green" : "red"}>{thousands(data.unrealized.toFixed(2))} {data.mainCurrency}</StatValue>
                        <StatSubValue className={unrealizedPerc > 0 ? "green" : "red"}>{unrealizedPerc.toFixed(2)}%</StatSubValue>
                    </Stat>
                    <Stat>
                        <StatLabel>Today</StatLabel>
                        <StatValue className={data.today > 0 ? "green" : "red"}>{thousands(data.today.toFixed(2))} {data.mainCurrency}</StatValue>
                        <StatSubValue className={todayPerc > 0 ? "green" : "red"}>{todayPerc.toFixed(2)}%</StatSubValue>
                    </Stat>
                </Stats>
                <Tabs defaultActiveKey="daily">
                    <Tabs.Tab eventKey="daily" title="Daily">
                        <DailyProfitLoss />
                    </Tabs.Tab>
                    <Tabs.Tab eventKey="value" title="Value">
                        <DailyValue />
                    </Tabs.Tab>
                    <Tabs.Tab eventKey="distribution" title="Distribution">
                        <ChartWrapper>
                            <Chart
                                options={{
                                    labels: labels,
                                    stroke: {
                                        show: false
                                    },
                                    dataLabels: {
                                        enabled: true,
                                        dropShadow: {
                                            enabled: false
                                        }
                                    }
                                }}
                                series={series}
                                type="donut"
                                width="350"
                                height="200"
                            />
                        </ChartWrapper>
                    </Tabs.Tab>
                    <Tabs.Tab eventKey="sectors" title="Sectors">
                        <TableWrapper>
                            <Table data={sectors} height={200}>
                                <Table.Column width={250} align="left">
                                    <Table.HeaderCell>Sector</Table.HeaderCell>
                                    <Table.Cell>
                                        {(rowData: any) => (
                                            <span>[{rowData.ticker}] {rowData.name}</span>
                                        )}
                                    </Table.Cell>
                                </Table.Column>
                                <Table.Column width={100} align="center">
                                    <Table.HeaderCell>Change %</Table.HeaderCell>
                                    <Table.Cell>
                                        {(rowData: any) => (
                                            <span className={rowData.changePercent > 0 ? "green" : "red"}>{rowData.changePercent.toFixed(2)}%</span>
                                        )}
                                    </Table.Cell>
                                </Table.Column>
                            </Table>
                        </TableWrapper>
                    </Tabs.Tab>
                </Tabs>
                <Tabs defaultActiveKey="stocks">
                    <Tabs.Tab eventKey="stocks" title="Stocks">
                        <TableWrapper>
                            <HoldingTable totalValue={data.totalValue} data={stockHoldings} userData={userData} />
                        </TableWrapper>
                    </Tabs.Tab>
                    <Tabs.Tab eventKey="bonds" title="Bonds">
                        <TableWrapper>
                            <HoldingTable totalValue={data.totalValue} data={bondHoldings} userData={userData} />
                        </TableWrapper>
                    </Tabs.Tab>
                    <Tabs.Tab eventKey="crypto" title="Crypto">
                        <TableWrapper>
                            <HoldingTable totalValue={data.totalValue} data={cryptoHoldings} userData={userData} />
                        </TableWrapper>
                    </Tabs.Tab>
                    <Tabs.Tab eventKey="options" title="Options">
                        <TableWrapper>
                            <HoldingTable totalValue={data.totalValue} data={optionHoldings} userData={userData} />
                        </TableWrapper>
                    </Tabs.Tab>
                    <Tabs.Tab eventKey="cash" title="Cash">
                        <TableWrapper>
                            <TableWrapper>
                                <Table data={data.accounts} height={280}>
                                    <Table.Column width={150} align="center">
                                        <Table.HeaderCell>Name</Table.HeaderCell>
                                        <Table.Cell dataKey="name" />
                                    </Table.Column>
                                    <Table.Column width={150} align="center">
                                        <Table.HeaderCell>Balance</Table.HeaderCell>
                                        <Table.Cell>
                                            {(rowData: any) => (
                                                <span>{thousands(rowData.balance.toFixed(2))} {rowData.currency}</span>
                                            )}
                                        </Table.Cell>
                                    </Table.Column>
                                </Table>
                            </TableWrapper>
                        </TableWrapper>
                    </Tabs.Tab>
                </Tabs>
            </Wrapper>
        </Panel>
    );
}