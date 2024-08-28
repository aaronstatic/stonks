import { BaseNode, NodeData, ValueType } from './BaseNode';
import { Form, InputNumber } from 'rsuite';

type RSINodeData = NodeData & {
    length: number
};

export default class RSINode extends BaseNode<RSINodeData> {
    static displayName = "RSI";

    defaultValues = {
        name: "RSI",
        length: 14
    }

    static inputs = [{
        name: 'Candles',
        type: ValueType.candles
    }]

    static outputs = [{
        name: 'RSI',
        type: ValueType.numberstream
    }]

    inputs = RSINode.inputs;
    outputs = RSINode.outputs;

    renderForm(data: RSINodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>RSI Length</Form.ControlLabel>
                <InputNumber
                    name="length"
                    value={data.length}
                    onChange={v => this.onChange('length', v)}
                />
            </Form.Group>
        </>
    }
}