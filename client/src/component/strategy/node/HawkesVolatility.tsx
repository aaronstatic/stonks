import { BaseNode, NodeData } from './BaseNode';
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

    inputs = [{
        name: 'Candles',
        type: 'candles'
    }]

    outputs = [{
        name: 'Hawkes',
        type: 'number'
    }, {
        name: 'Quantile95',
        type: 'number'
    }, {
        name: 'Quantile05',
        type: 'number'
    }, {
        name: 'ATR',
        type: 'number'
    }, {
        name: 'CrossUp',
        type: 'trigger'
    }, {
        name: 'CrossDown',
        type: 'trigger'
    }]

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