import CRUDTable from "../component/CRUDTable";
import { DatePicker, Form, InputNumber, InputPicker, Table } from "rsuite";
import Trade from "@schema/trade";
import { JSX } from "react/jsx-runtime";
import { DateTime } from "luxon";
import Account from "@schema/account";
import { CRUDState } from "../component/CRUD";
import Server from "../lib/Server";

interface TradesState extends CRUDState {
    accounts: Account[];
    selectedObject: Trade | null;
}

class Trades extends CRUDTable {
    displayName = "Trade";
    type = "trade";

    defaultValues = {
        type: "BUY",
        _id: "new",
        holding: "",
        quantity: 0,
        timestamp: "",
        price: 0,
        fees: 0,
        transaction: "",
        account: ""
    } as Trade;

    static defaultProps = {
        holding: ""
    }

    refreshOnChange = true;

    constructor(props: any) {
        super(props);

        this.state = {
            ...this.state,
            accounts: []
        } as TradesState;

        this.defaultValues.timestamp = DateTime.now().toISO();

        if (props.holding != "") {
            this.defaultValues.holding = props.holding;
            this.state = {
                ...this.state,
                filter: { holding: props.holding }
            }
        }

        this.loadAccounts();
    }

    loadAccounts() {
        Server.getAll('account').then((accounts) => {
            this.setState({ accounts } as TradesState);
            if (accounts.length > 0)
                this.defaultValues.account = accounts[0]._id;
        });
    }

    renderColumns(): JSX.Element {
        return (
            <>
                <Table.Column width={150}>
                    <Table.HeaderCell>Date</Table.HeaderCell>
                    <Table.Cell>
                        {rowData => DateTime.fromISO(rowData.timestamp).toLocaleString(DateTime.DATETIME_MED)}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.Cell dataKey="type" />
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Quantity</Table.HeaderCell>
                    <Table.Cell dataKey="quantity" />
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Price</Table.HeaderCell>
                    <Table.Cell dataKey="price" />
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Total</Table.HeaderCell>
                    <Table.Cell>
                        {rowData => {
                            let mul = -1;
                            if (rowData.type == "SELL") {
                                mul = 1;
                            }
                            return ((rowData.price * rowData.quantity * mul) - rowData.fees).toFixed(2);
                        }}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Balance</Table.HeaderCell>
                    <Table.Cell dataKey="balance" />
                </Table.Column>
            </>
        );
    }

    getFormData() {
        const { selectedObject } = this.state;
        const trade = selectedObject as Trade;
        if (!trade) return null;

        trade.quantity = parseFloat(trade.quantity.toString());
        trade.price = parseFloat(trade.price.toString());
        trade.fees = parseFloat(trade.fees.toString());

        return trade;
    }

    renderForm() {
        const { selectedObject, accounts } = this.state as TradesState;
        const trade = selectedObject as Trade;
        const selectedAccount = accounts.find((a) => a._id == trade?.account);
        return (
            <>
                <Form.Group controlId="timestamp">
                    <Form.ControlLabel>Date</Form.ControlLabel>
                    <DatePicker
                        format="dd/MM/yyyy HH:mm"
                        name="timestamp"
                        value={DateTime.fromISO(trade?.timestamp).toJSDate()}
                        onChange={v => {
                            if (v instanceof Date)
                                this.onFieldChange("timestamp", DateTime.fromJSDate(v).toISO());
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="timestamp">
                    <Form.ControlLabel>Type</Form.ControlLabel>
                    <InputPicker
                        cleanable={false}
                        name="type"
                        data={[
                            { label: "BUY", value: "BUY" },
                            { label: "SELL", value: "SELL" }
                        ]}
                        value={trade?.type}
                        onChange={(v) => {
                            this.onFieldChange("type", v);
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="account">
                    <Form.ControlLabel>Account</Form.ControlLabel>
                    <InputPicker
                        name="account"
                        cleanable={false}
                        data={accounts.map((a) => ({ label: a.name, value: a._id }))}
                        value={trade?.account}
                        onChange={(v) => {
                            this.onFieldChange("account", v);
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="amount">
                    <Form.ControlLabel>Quantity</Form.ControlLabel>
                    <InputNumber
                        name="quantity"
                        min={0}
                        value={trade?.quantity}
                        onChange={(v) => {
                            this.onFieldChange("quantity", v);
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="price">
                    <Form.ControlLabel>Price</Form.ControlLabel>
                    <InputNumber
                        name="price"
                        value={trade?.price}
                        min={0}
                        formatter={v => {
                            return `${v} ${selectedAccount?.currency}`;
                        }}
                        onChange={(v) => {
                            this.onFieldChange("price", v);
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="fees">
                    <Form.ControlLabel>Fees</Form.ControlLabel>
                    <InputNumber
                        name="fees"
                        value={trade?.fees}
                        min={0}
                        formatter={v => {
                            return `${v} ${selectedAccount?.currency}`;
                        }}
                        onChange={(v) => {
                            this.onFieldChange("fees", v);
                        }}
                    />
                </Form.Group>
            </>
        );
    }

}

export default Trades;