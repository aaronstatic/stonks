import { BaseNode, NodeData, ValueType } from './BaseNode';
import { Form, InputNumber } from 'rsuite';

type HawkesVolatilityNodeData = NodeData & {
    kappa: number
    atrLength: number
    quantileLength: number
};

export default class HawkesVolatilityNode extends BaseNode<HawkesVolatilityNodeData> {
    static displayName = "Hawkes Volatility";

    defaultValues = {
        name: "Hawkes Volatility",
        kappa: 0.1,
        atrLength: 10,
        quantileLength: 96
    }

    static inputs = [{
        name: 'Candles',
        type: ValueType.candles
    }]

    static outputs = [{
        name: 'Hawkes',
        type: ValueType.numberstream
    }, {
        name: 'Quantile95',
        type: ValueType.numberstream
    }, {
        name: 'Quantile05',
        type: ValueType.numberstream
    }, {
        name: 'ATR',
        type: ValueType.numberstream
    }, {
        name: 'CrossUp',
        type: ValueType.trigger
    }, {
        name: 'CrossDown',
        type: ValueType.trigger
    }]

    inputs = HawkesVolatilityNode.inputs;
    outputs = HawkesVolatilityNode.outputs

    renderForm(data: HawkesVolatilityNodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>Kappa</Form.ControlLabel>
                <InputNumber
                    name="kappa"
                    value={data.kappa}
                    onChange={v => this.onChange('kappa', v)}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>ATR Length</Form.ControlLabel>
                <InputNumber
                    name="atrLength"
                    value={data.atrLength}
                    onChange={v => this.onChange('atrLength', v)}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>Quantile Length</Form.ControlLabel>
                <InputNumber
                    name="quantileLength"
                    value={data.quantileLength}
                    onChange={v => this.onChange('quantileLength', v)}
                />
            </Form.Group>
        </>
    }
}