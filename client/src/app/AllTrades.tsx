import Trade from "@schema/trade";
import { useEffect, useState } from "react";
import Server from "../lib/Server";
import { Button, Loader, Pagination, Table, Tabs } from "rsuite";
import styled from "styled-components";
import { DateTime } from "luxon";
import Icon from "../component/Icon";
import AddTrade from "./AddTrade";

const Row = styled.div`
    display: flex;
    height: 100%;
    .rs-table-cell {
        background: transparent;
    }
`

const buyBackground = 'rgba(88, 177, 91, 0.1)'
const sellBackground = 'rgba(240, 79, 67, 0.1)'

const AddButton = styled(Button)`
    margin-bottom: 10px;
`

export default function AllTrades() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        Server.getReport('all-trades').then((trades) => {
            setTrades(trades as Trade[]);
            setLoading(false);
        });
    }, []);

    if (loading) return <Loader size="md" center />;

    const pageData = trades.slice((page - 1) * 10, page * 10);

    return (
        <>
            <div style={{ display: showAdd ? 'none' : 'block' }}>
                <AddButton onClick={() => setShowAdd(true)}>
                    <Icon name="add" />
                    Add Trade
                </AddButton>

                <Pagination
                    prev
                    next
                    first
                    last
                    ellipsis
                    boundaryLinks
                    size="xs"
                    activePage={page}
                    onChangePage={setPage}
                    limit={10}
                    total={trades.length}
                />

                <Table
                    data={pageData}
                    autoHeight
                    renderRow={(children, rowData) => {
                        if (!rowData) return <Row>{children}</Row>;
                        if (rowData.type === 'BUY') {
                            return <Row style={{ backgroundColor: buyBackground }}>
                                {children}
                            </Row>
                        }
                        return <Row style={{ backgroundColor: sellBackground }}>
                            {children}
                        </Row>
                    }}
                >
                    <Table.Column width={40} align="center">
                        <Table.HeaderCell>&nbsp;</Table.HeaderCell>
                        <Table.Cell dataKey="id">
                            {rowData => {
                                if (rowData.holdingType == "Crypto") {
                                    return <Icon name="currency_bitcoin" />
                                }
                                if (rowData.holdingType == "Stock") {
                                    return <Icon name="trending_up" />
                                }
                                if (rowData.holdingType == "Option") {
                                    return <Icon name="query_stats" />
                                }
                                if (rowData.holdingType == "MultiLegOption") {
                                    return <Icon name="stack" />
                                }
                            }}
                        </Table.Cell>
                    </Table.Column>
                    <Table.Column width={150} align="center" fixed>
                        <Table.HeaderCell>Timestamp</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => DateTime.fromISO(rowData.timestamp).toLocaleString(DateTime.DATETIME_MED)}
                        </Table.Cell>
                    </Table.Column>
                    <Table.Column width={80} align="center">
                        <Table.HeaderCell>Side</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => rowData.type === 'BUY' ? 'Buy' : 'Sell'}
                        </Table.Cell>
                    </Table.Column>
                    <Table.Column width={80} align="center">
                        <Table.HeaderCell>Quantity</Table.HeaderCell>
                        <Table.Cell dataKey="quantity" />
                    </Table.Column>
                    <Table.Column width={200} align="center">
                        <Table.HeaderCell>Equity</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => rowData.name}
                        </Table.Cell>
                    </Table.Column>
                    <Table.Column width={100} align="center">
                        <Table.HeaderCell>Price</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => `${rowData.price.toFixed(2)} ${rowData.holdingData.currency}`}
                        </Table.Cell>
                    </Table.Column>
                    <Table.Column width={100} align="center">
                        <Table.HeaderCell>Total</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => `${rowData.total.toFixed(2)} ${rowData.holdingData.currency}`}
                        </Table.Cell>
                    </Table.Column>
                    <Table.Column width={80} align="center">
                        <Table.HeaderCell>Balance</Table.HeaderCell>
                        <Table.Cell>
                            {rowData => rowData.balance.toFixed(2)}
                        </Table.Cell>
                    </Table.Column>
                </Table>
            </div>
            <div style={{ display: showAdd ? 'block' : 'none' }}>
                <AddTrade
                    onAdd={() => {
                        Server.getReport('all-trades').then((trades) => {
                            setTrades(trades as Trade[]);
                        });
                    }}
                    onCancel={() => setShowAdd(false)}
                />
            </div>
        </>
    );
}