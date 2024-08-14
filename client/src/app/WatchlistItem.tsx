import WatchlistItem from "@schema/watchlist";
import { useContext, useEffect, useState } from "react";
import { Button, Loader, Tabs } from 'rsuite';
import { ItemData } from "../App";
import Server from "../lib/Server";
import Candles from "../report/Candles";
import NetGEX from "../report/NetGEX";

import styled from "styled-components";

import { Stats, Stat, StatLabel, StatValue } from '../report/component/Stats';
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

export default function WatchlistItemReport() {
    const [item, setItem] = useState<WatchlistItem | null>(null);
    const [details, setDetails] = useState<any>(null);
    const itemData = useContext(ItemData);

    useEffect(() => {
        if (!itemData) return;

        Server.get("watchlist", itemData.id).then((doc) => {
            const item = doc as WatchlistItem;
            setItem(item);

            Server.queryDatabase('stocks-detail', { ticker: item.ticker }).then((details) => {
                if (details.length > 0)
                    setDetails(details[0]);
            });

        });



    }, [itemData]);

    if (!item || !details) return <Loader center />

    return (
        (item && (
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
                        <Title>[{item.ticker}]</Title>
                    )}
                </Tabs.Tab>
                <Tabs.Tab eventKey="chart" title="Chart">
                    <Candles avgOpen={0} title={details.name} ticker={item.ticker} type="Stock" />
                </Tabs.Tab>

                <Tabs.Tab eventKey="financials" title="Financials">
                    <Financials ticker={item.ticker} tickerDetails={details} />
                </Tabs.Tab>

                <Tabs.Tab eventKey="netgex" title="Net GEX">
                    <NetGEX ticker={item.ticker} />
                </Tabs.Tab>

            </Tabs>
        )) || <Loader center />
    )
}