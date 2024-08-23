import { BaseNode, NodeData } from './BaseNode';
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

    inputs = [{
        name: 'Candles',
        type: 'candles'
    }]

    outputs = [{
        name: 'RSI',
        type: 'number'
    }]

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