import CRUDTable from "../component/CRUDTable";
import { DatePicker, Form, InputNumber, Table } from "rsuite";
import Transaction from "@schema/transaction";
import { JSX } from "react/jsx-runtime";
import { DateTime } from "luxon";

class Transactions extends CRUDTable {
    displayName = "Transaction";
    type = "transaction";

    defaultValues = {
        description: "Deposit",
        _id: "new",
        amount: 0,
        account: ""
    } as Transaction;

    static defaultProps = {
        account: "",
        currency: "USD"
    }

    refreshOnChange = true;

    constructor(props: any) {
        super(props);

        this.defaultValues.timestamp = DateTime.now().toISO();

        if (props.account != "") {
            this.defaultValues.account = props.account;
            this.state = {
                ...this.state,
                filter: { account: props.account }
            }
        }
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
                <Table.Column width={200}>
                    <Table.HeaderCell>Description</Table.HeaderCell>
                    <Table.Cell dataKey="description" />
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Amount</Table.HeaderCell>
                    <Table.Cell>
                        {rowData => `${rowData.amount?.toFixed(2)} ${this.props.currency}`}
                    </Table.Cell>
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Balance</Table.HeaderCell>
                    <Table.Cell>
                        {rowData => `${rowData.balance.toFixed(2)} ${this.props.currency}`}
                    </Table.Cell>
                </Table.Column>
            </>
        );
    }

    getFormData() {
        const { selectedObject } = this.state;
        const transaction = selectedObject as Transaction;
        if (!transaction) return null;
        transaction.amount = parseFloat(transaction.amount.toString());
        return transaction;
    }

    renderForm() {
        const { selectedObject } = this.state;
        const transaction = selectedObject as Transaction;
        return (
            <>
                <Form.Group controlId="timestamp">
                    <Form.ControlLabel>Date</Form.ControlLabel>
                    <DatePicker
                        format="dd/MM/yyyy HH:mm"
                        name="timestamp"
                        value={DateTime.fromISO(transaction?.timestamp).toJSDate()}
                        onChange={v => {
                            if (v instanceof Date)
                                this.onFieldChange("timestamp", DateTime.fromJSDate(v).toISO());
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="description">
                    <Form.ControlLabel>Description</Form.ControlLabel>
                    <Form.Control name="currency" value={transaction?.description} onChange={(v) => this.onFieldChange("description", v)} />
                </Form.Group>
                <Form.Group controlId="amount">
                    <Form.ControlLabel>Amount</Form.ControlLabel>
                    <InputNumber
                        name="amount"
                        formatter={v => `${v} ${this.props.currency}`}
                        value={transaction?.amount}
                        onChange={(v) => {
                            this.onFieldChange("amount", v);
                        }}
                    />
                </Form.Group>
            </>
        );
    }

}

export default Transactions;