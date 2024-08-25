import { BaseNode, NodeData } from './BaseNode';
import { Form, InputNumber } from 'rsuite';

type EMANodeData = NodeData & {
    length: number
};

export default class EMANode extends BaseNode<EMANodeData> {
    static displayName = "EMA";

    defaultValues = {
        name: "EMA",
        length: 50
    }

    inputs = [{
        name: 'Candles',
        type: 'candles'
    }]

    outputs = [{
        name: 'EMA',
        type: 'number'
    }]

    renderForm(data: EMANodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>EMA Length</Form.ControlLabel>
                <InputNumber
                    name="length"
                    value={data.length}
                    onChange={v => this.onChange('length', v)}
                />
            </Form.Group>
        </>
    }
}