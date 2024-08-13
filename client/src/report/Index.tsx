import { useContext } from "react";
import Candles from "./Candles";
import { ItemData } from "../App";

import { Tabs } from 'rsuite';
import NetGEX from "./NetGEX";

export default function Index() {
    const itemData = useContext(ItemData);

    if (!itemData) return null;
    const ticker = itemData.id;

    if (itemData.subType === "Stock") {
        return (
            <Tabs defaultActiveKey="chart" style={{ marginTop: '1rem' }}>
                <Tabs.Tab eventKey="chart" title="Chart">
                    <Candles avgOpen={0} title={ticker} ticker={ticker} type="Stock" />
                </Tabs.Tab>

                <Tabs.Tab eventKey="netgex" title="Net GEX">
                    <NetGEX ticker={ticker} />
                </Tabs.Tab>
            </Tabs>
        )
    } else {
        return (
            <Candles type={itemData.subType || "Index"} ticker={itemData.id} title={itemData.id} avgOpen={0} />
        );
    }
}