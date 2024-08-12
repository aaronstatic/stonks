import CRUDTable from "../component/CRUDTable";
import { Form, InputNumber, InputPicker, Table } from "rsuite";
import Holding from "@schema/holding";
import { JSX } from "react/jsx-runtime";

class Holdings extends CRUDTable {
    displayName = "Holding";
    type = "holding";

    defaultValues = {
        ticker: "",
        _id: "new",
        type: "Stock",
        risk: 0,
        currency: "USD"
    } as Holding;

    sort() {
        return (a: Holding, b: Holding) => {
            if (a.ticker < b.ticker) return -1;
            if (a.ticker > b.ticker) return 1;
            return 0;
        }
    }

    renderColumns(): JSX.Element {
        return (
            <>
                <Table.Column width={200}>
                    <Table.HeaderCell>Ticker</Table.HeaderCell>
                    <Table.Cell dataKey="ticker" />
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.Cell dataKey="type" />
                </Table.Column>
                <Table.Column width={120}>
                    <Table.HeaderCell>Risk</Table.HeaderCell>
                    <Table.Cell dataKey="risk" />
                </Table.Column>
            </>
        );
    }

    onOpen = (id: string) => {
        this.openObject(id);
    }

    renderForm() {
        const { selectedObject } = this.state;
        const holding = selectedObject as Holding;
        return (
            <>
                <Form.Group controlId="ticker">
                    <Form.ControlLabel>Ticker</Form.ControlLabel>
                    <Form.Control name="currency" value={holding?.ticker} onChange={(v) => this.onFieldChange("ticker", v)} />
                </Form.Group>
                <Form.Group controlId="type">
                    <Form.ControlLabel>Type</Form.ControlLabel>
                    <InputPicker
                        name="type"
                        data={[
                            { label: "Stock", value: "Stock" },
                            { label: "Crypto", value: "Crypto" },
                            { label: "Option", value: "Option" }
                        ]}
                        value={holding?.type}
                        onChange={(v) => {
                            this.onFieldChange("type", v);
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="risk">
                    <Form.ControlLabel>Risk</Form.ControlLabel>
                    <InputNumber
                        name="amount"
                        min={0}
                        value={holding?.risk}
                        onChange={(v) => {
                            this.onFieldChange("risk", v);
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="ticker">
                    <Form.ControlLabel>Currency</Form.ControlLabel>
                    <Form.Control name="currency" value={holding?.currency} onChange={(v) => this.onFieldChange("currency", v)} />
                </Form.Group>
            </>
        );
    }

}

export default Holdings;