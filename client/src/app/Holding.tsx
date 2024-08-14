import Holding from "@schema/holding";
import { useContext, useEffect, useState } from "react";
import { Button, Loader, Tabs } from 'rsuite';
import { ItemData, UserData } from "../App";
import Server from "../lib/Server";
import Trades from "./Trades";
import Options from "./Options";
import Candles from "../report/Candles";
import { HoldingReport } from "@schema/report/holding";
import styled from "styled-components";
import NetGEX from "../report/NetGEX";

import { Stats, Stat, StatLabel, StatValue, StatSubValue } from '../report/component/Stats';
import Financials from "./Financials";
import { formatLargeNumber } from "../util/format";

const HoldingStat = styled(Stat)`
    background-color: var(--rs-gray-700);
`

const HoldingStats = styled(Stats)`
    margin-bottom: 10px;
`

const Title = styled.h4`
    margin-bottom: 1rem;
`

const Logo = styled.img`
    width: 200px;
    margin-bottom: 1rem;
    @media (max-width: 900px) {
        width: 50px;
    }
`

const Description = styled.p`
    margin-bottom: 1rem;
    font-size: 0.8em;
`

export default function AccountView() {
    const [holding, setHolding] = useState<Holding | null>(null);
    const [holdingReport, setHoldingReport] = useState<HoldingReport | null>(null);
    const [details, setDetails] = useState<any>(null);
    const itemData = useContext(ItemData);
    const userData = useContext(UserData);

    useEffect(() => {
        if (!itemData) return;

        Server.get("holding", itemData.id).then((doc) => {
            const holding = doc as Holding;
            setHolding(holding);
            Server.getReport('holding', { ticker: holding.ticker, type: holding.type }).then((report) => {
                setHoldingReport(report as HoldingReport);
            });
            if (holding.type == "Stock") {
                Server.queryDatabase('stocks-detail', { ticker: holding.ticker }).then((details) => {
                    if (details.length > 0)
                        setDetails(details[0]);
                });
            }
        });



    }, [itemData]);

    if (!holding || !holdingReport || !userData) return <Loader center />

    return (
        (holding && (
            <Tabs defaultActiveKey="overview">
                <Tabs.Tab eventKey="overview" title="Overview">
                    {details && details.logo && (
                        <Logo src={details.logo} alt={details.name} />
                    )}
                    {details && details.name && (
                        <Title>[{details.ticker}] {details.name}
                            {details && details.homepage_url && (
                                <Button style={{ marginLeft: 10 }} href={details.homepage_url} target="_blank">Visit Website</Button>
                            )}
                        </Title>
                    )}
                    {details && details.description && (
                        <>
                            <Description>{details.description}</Description>
                            <HoldingStats>
                                {details.market_cap && (
                                    <HoldingStat>
                                        <StatLabel>Market Cap</StatLabel>
                                        <StatValue>{formatLargeNumber(details.market_cap)} {details.currency_name.toUpperCase()}</StatValue>
                                    </HoldingStat>
                                )}
                                {details.share_class_shares_outstanding && (
                                    <HoldingStat>
                                        <StatLabel>Shares Outstanding</StatLabel>
                                        <StatValue>{formatLargeNumber(details.share_class_shares_outstanding)}</StatValue>
                                    </HoldingStat>
                                )}
                            </HoldingStats>
                        </>
                    )}
                    {!details && (
                        <Title>[{holding.ticker}] {holding.name}</Title>
                    )}

                    <HoldingStats>
                        {holdingReport.value > 0 && (
                            <HoldingStat>
                                <StatLabel>Value</StatLabel>
                                <StatValue>{holdingReport.value.toFixed(2)} {userData.currency}</StatValue>
                            </HoldingStat>
                        )}
                        {holdingReport.openQuantity > 0 && (
                            <>
                                <HoldingStat>
                                    <StatLabel>Open Quantity</StatLabel>
                                    <StatValue>{holdingReport.openQuantity.toFixed(2)}</StatValue>
                                </HoldingStat>

                                <HoldingStat>
                                    <StatLabel>Average Open Price</StatLabel>
                                    <StatValue>{holdingReport.averageOpenPrice.toFixed(2)} {holding.currency}</StatValue>
                                </HoldingStat>
                            </>
                        )}
                        {holdingReport.unrealized != 0 && (
                            <>
                                <HoldingStat>
                                    <StatLabel>Last Price</StatLabel>
                                    <StatValue>{holdingReport.lastPrice.toFixed(2)} {holding.currency}</StatValue>
                                </HoldingStat>
                                <HoldingStat>
                                    <StatLabel>Unrealized P&L</StatLabel>
                                    <StatValue className={holdingReport.unrealized > 0 ? "green" : "red"}>{holdingReport.unrealized.toFixed(2)} {userData.currency}</StatValue>
                                    {holdingReport.cost != 0 && (
                                        <StatSubValue className={holdingReport.unrealized > 0 ? "green" : "red"}>{(holdingReport.unrealized / holdingReport.cost * 100).toFixed(2)}%</StatSubValue>
                                    )}
                                </HoldingStat>
                            </>
                        )}
                        {holdingReport.realized != 0 && (
                            <>
                                <HoldingStat>
                                    <StatLabel>Realized P&L</StatLabel>
                                    <StatValue className={holdingReport.realized > 0 ? "green" : "red"}>{holdingReport.realized.toFixed(2)} {userData.currency}</StatValue>
                                </HoldingStat>
                                <HoldingStat>
                                    <StatLabel>Total P&L</StatLabel>
                                    <StatValue className={holdingReport.realized > 0 ? "green" : "red"}>{(holdingReport.realized + holdingReport.unrealized).toFixed(2)} {userData.currency}</StatValue>
                                </HoldingStat>
                            </>
                        )}
                        {holdingReport.openQuantity > 0 && (
                            <HoldingStat>
                                <StatLabel>Today</StatLabel>
                                <StatValue className={holdingReport.today > 0 ? "green" : "red"}>{holdingReport.today.toFixed(2)} {userData.currency}</StatValue>
                            </HoldingStat>
                        )}
                    </HoldingStats>
                </Tabs.Tab>
                <Tabs.Tab eventKey="chart" title="Chart">
                    <Candles avgOpen={holdingReport.averageOpenPrice} title={holding.name} ticker={holding.ticker} type={holding.type} />
                </Tabs.Tab>
                {holding.type == "Stock" && (
                    <>
                        <Tabs.Tab eventKey="financials" title="Financials">
                            <Financials ticker={holding.ticker} tickerDetails={details} />
                        </Tabs.Tab>
                        <Tabs.Tab eventKey="netgex" title="Net GEX">
                            <NetGEX ticker={holding.ticker} />
                        </Tabs.Tab>
                    </>
                )}
                <Tabs.Tab eventKey="trades" title="Trades">
                    <Trades holding={holding._id} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="options" title="Options">
                    <Options holding={holding._id} />
                </Tabs.Tab>
            </Tabs>
        )) || <Loader center />
    )
}