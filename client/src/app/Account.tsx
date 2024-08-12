import Account from "@schema/account";
import { useContext, useEffect, useState } from "react";
import { Loader, Tabs } from 'rsuite';
import { ItemData } from "../App";
import Server from "../lib/Server";
import Transactions from "./Transactions";

export default function AccountView() {
    const [account, setAccount] = useState<Account | null>(null);
    const itemData = useContext(ItemData);

    useEffect(() => {
        if (!itemData) return;

        Server.get("account", itemData.id).then((account) => {
            setAccount(account as Account);
        });

    }, [itemData]);
    return (
        (account && (
            <Tabs defaultActiveKey="overview">
                <Tabs.Tab eventKey="overview" title="Overview">
                    <h1>{account.name}</h1>
                </Tabs.Tab>
                <Tabs.Tab eventKey="transactions" title="Transactions">
                    <Transactions account={account._id} currency={account.currency} />
                </Tabs.Tab>
            </Tabs>
        )) || <Loader center />
    )
}