import CRUDTable from "../component/CRUDTable";
import { Form, Table } from "rsuite";
import { WatchlistReportItem } from "@schema/report/watchlist";
import { JSX } from "react/jsx-runtime";
import Server from "../lib/Server";
import { DateTime } from "luxon";

class Watchlist extends CRUDTable {
    displayName = "Watchlist Item";
    type = "watchlist";

    defaultValues = {
        _id: "new",
        ticker: "",
        owner: "",
        name: ""
    };

    sort() {
        return (a: WatchlistReportItem, b: WatchlistReportItem) => {
            if (a.ticker < b.ticker) return -1;
            if (a.ticker > b.ticker) return 1;
            return 0;
        }
    }

    load() {
        Server.getReport("watchlist").then((objects: any) => {
            const sortFn = this.sort();
            if (sortFn) {
                objects.sort(sortFn);
            }
            this.setState({ data: objects });
        });
    }

    renderColumns(): JSX.Element {
        return (
            <>
                <Table.Column width={100}>
                    <Table.HeaderCell>Ticker</Table.HeaderCell>
                    <Table.Cell dataKey="ticker" />
                </Table.Column>
                <Table.Column width={100}>
                    <Table.HeaderCell>Last Price</Table.HeaderCell>
                    <Table.Cell>
                        {(rowData: WatchlistReportItem) => {
                            if (!rowData.lastPrice) return "";
                            return rowData.lastPrice.toFixed(2) + " " + rowData.currency;
                        }}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={100}>
                    <Table.HeaderCell>Intrinsic Value</Table.HeaderCell>
                    <Table.Cell>
                        {(rowData: WatchlistReportItem) => {
                            if (!rowData.intrinsicValue || rowData.intrinsicValue < 0) return "";
                            const value = rowData.intrinsicValue.toFixed(2) + " " + rowData.currency;
                            if (rowData.intrinsicValue > rowData.lastPrice) {
                                return <span className="green">{value}</span>;
                            } else {
                                return <span className="red">{value}</span>;
                            }
                        }}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={100}>
                    <Table.HeaderCell>Change</Table.HeaderCell>
                    <Table.Cell>
                        {(rowData: WatchlistReportItem) => {
                            if (!rowData.change) return "";
                            const value = rowData.change.toFixed(2) + " " + rowData.currency;
                            if (rowData.change > 0) {
                                return <span className="green">{value}</span>;
                            } else {
                                return <span className="red">{value}</span>;
                            }
                        }}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={80}>
                    <Table.HeaderCell>Change %</Table.HeaderCell>
                    <Table.Cell>
                        {(rowData: WatchlistReportItem) => {
                            if (!rowData.changePercent) return "";
                            const value = rowData.changePercent.toFixed(2) + "%";
                            if (rowData.changePercent > 0) {
                                return <span className="green">{value}</span>;
                            } else {
                                return <span className="red">{value}</span>;
                            }
                        }}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={80} align="center">
                    <Table.HeaderCell>Gamma</Table.HeaderCell>
                    <Table.Cell>
                        {(rowData: WatchlistReportItem) => (
                            <span className={rowData.gamma == 0 ? "zero" : rowData.gamma > 0 ? "green" : "red"}>
                                {rowData.gamma > 0 ? "+γ" : "-γ"}
                            </span>
                        )}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={140} align="center">
                    <Table.HeaderCell>Next Earnings</Table.HeaderCell>
                    <Table.Cell>
                        {(rowData: WatchlistReportItem) => {
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
            </>
        );
    }

    onOpen = (id: string) => {
        this.openObject(id);
    }

    renderForm() {
        const { selectedObject } = this.state;
        const watchlistItem = selectedObject as unknown as WatchlistReportItem;
        return (
            <>
                <Form.Group controlId="ticker">
                    <Form.ControlLabel>Ticker</Form.ControlLabel>
                    <Form.Control name="ticker" value={watchlistItem?.ticker} onChange={(v) => this.onFieldChange("ticker", v)} />
                </Form.Group>
            </>
        );
    }

}

export default Watchlist;