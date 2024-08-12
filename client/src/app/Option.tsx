import Option from "@schema/option";
import Holding from "@schema/holding";
import { useContext, useEffect, useState } from "react";
import { Loader, Tabs } from 'rsuite';
import { ItemData } from "../App";
import Server from "../lib/Server";
import OptionTrades from "./OptionTrades";

export default function AccountView() {
    const [option, setOption] = useState<Option | null>(null);
    const [holding, setHolding] = useState<Holding | null>(null);
    const itemData = useContext(ItemData);

    useEffect(() => {
        if (!itemData) return;

        Server.get("option", itemData.id).then((d) => {
            const option = d as Option;
            setOption(option);
            Server.get("holding", option.holding).then((holding) => {
                setHolding(holding as Holding);
            });
        });

    }, [itemData]);
    return (
        (option && holding && (
            <Tabs defaultActiveKey="overview">
                <Tabs.Tab eventKey="overview" title="Overview">
                    <h1>{holding.ticker} {option.strike} {option.type}</h1>
                </Tabs.Tab>
                <Tabs.Tab eventKey="trades" title="Trades">
                    <OptionTrades option={option._id} />
                </Tabs.Tab>
            </Tabs>
        )) || <Loader center />
    )
}