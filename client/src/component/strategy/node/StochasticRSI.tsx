import { BaseNode, NodeData } from './BaseNode';
import { Form, InputNumber } from 'rsuite';

type StochasticRSINodeData = NodeData & {
    length: number
    k: number
    d: number
    lengthStoch: number
};

export default class StochasticRSINode extends BaseNode<StochasticRSINodeData> {
    static displayName = "Stochastic RSI";

    defaultValues = {
        name: "Stochastic RSI",
        length: 14,
        k: 3,
        d: 3,
        lengthStoch: 14
    }

    inputs = [{
        name: 'Candles',
        type: 'candles'
    }]

    outputs = [{
        name: 'RSI',
        type: 'number'
    }]

    renderForm(data: StochasticRSINodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>K</Form.ControlLabel>
                <InputNumber
                    name="k"
                    value={data.k}
                    onChange={v => this.onChange('k', v)}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>D</Form.ControlLabel>
                <InputNumber
                    name="d"
                    value={data.d}
                    onChange={v => this.onChange('d', v)}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>RSI Length</Form.ControlLabel>
                <InputNumber
                    name="length"
                    value={data.length}
                    onChange={v => this.onChange('length', v)}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>Stochastic Length</Form.ControlLabel>
                <InputNumber
                    name="lengthStoch"
                    value={data.lengthStoch}
                    onChange={v => this.onChange('lengthStoch', v)}
                />
            </Form.Group>
        </>
    }
}