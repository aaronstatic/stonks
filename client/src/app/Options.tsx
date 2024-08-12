import CRUDTable from "../component/CRUDTable";
import { DatePicker, Form, InputNumber, InputPicker, Table } from "rsuite";
import Option from "@schema/option";
import { JSX } from "react/jsx-runtime";
import { DateTime } from "luxon";
import Server from "../lib/Server";

class Options extends CRUDTable {
    displayName = "Option";
    type = "option";

    defaultValues = {
        type: "Call",
        _id: "new",
        holding: "",
        strike: 0,
        expiry: ""
    } as Option;

    static defaultProps = {
        holding: ""
    }

    refreshOnChange = true;

    constructor(props: any) {
        super(props);

        this.defaultValues.expiry = DateTime.now().startOf("day").toISO();

        if (props.holding != "") {
            this.defaultValues.holding = props.holding;
            this.state = {
                ...this.state,
                filter: { holding: props.holding }
            }
        }
    }

    renderColumns(): JSX.Element {
        return (
            <>
                <Table.Column width={150}>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.Cell dataKey="type" />
                </Table.Column>
                <Table.Column width={150}>
                    <Table.HeaderCell>Strike</Table.HeaderCell>
                    <Table.Cell dataKey="strike" />
                </Table.Column>
                <Table.Column width={150}>
                    <Table.HeaderCell>Expiry</Table.HeaderCell>
                    <Table.Cell>
                        {(rowData: Option) => {
                            return DateTime.fromISO(rowData.expiry).toLocaleString(DateTime.DATE_SHORT);
                        }}
                    </Table.Cell>
                </Table.Column>
            </>
        );
    }

    onOpen = (id: string) => {
        Server.emit("open-object", { type: "option", id });
    }

    getFormData() {
        const { selectedObject } = this.state;
        const trade = selectedObject as Option;
        if (!trade) return null;

        trade.strike = parseFloat(trade.strike.toString());

        return trade;
    }

    renderForm() {
        const { selectedObject } = this.state;
        const option = selectedObject as Option;

        return (
            <>
                <Form.Group controlId="timestamp">
                    <Form.ControlLabel>Expiry</Form.ControlLabel>
                    <DatePicker
                        format="dd/MM/yyyy"
                        name="expiry"
                        value={DateTime.fromISO(option?.expiry).toJSDate()}
                        onChange={v => {
                            if (v instanceof Date)
                                this.onFieldChange("expiry", DateTime.fromJSDate(v).toISO());
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="type">
                    <Form.ControlLabel>Type</Form.ControlLabel>
                    <InputPicker
                        cleanable={false}
                        name="type"
                        data={[
                            { label: "Call", value: "Call" },
                            { label: "Put", value: "Put" }
                        ]}
                        value={option?.type}
                        onChange={(v) => {
                            this.onFieldChange("type", v);
                        }}
                    />
                </Form.Group>
                <Form.Group controlId="strike">
                    <Form.ControlLabel>Strike</Form.ControlLabel>
                    <InputNumber
                        name="strike"
                        min={0}
                        value={option?.strike}
                        onChange={(v) => {
                            this.onFieldChange("strike", v);
                        }}
                    />
                </Form.Group>
            </>
        );
    }

}

export default Options;