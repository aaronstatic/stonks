import { BaseNode, NodeData } from './BaseNode';
import { Form, InputNumber, InputPicker } from 'rsuite';
import InputHandle from '../InputHandle';

type MathNodeData = NodeData & {
    type: string,
    secondvalue: number
};

export default class MathNode extends BaseNode<MathNodeData> {
    static displayName = "Math";

    defaultValues = {
        name: "Math",
        type: "+",
        secondvalue: 0
    }

    inputs = [{
        name: 'Value',
        type: 'number'
    }]

    outputs = [{
        name: 'Result',
        type: 'number'
    }]

    renderForm(data: MathNodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>Type</Form.ControlLabel>
                <InputPicker
                    name="type"
                    value={data.type}
                    onChange={v => this.onChange('type', v)}
                    cleanable={false}
                    data={[
                        { label: 'Multiply', value: '*' },
                        { label: 'Add', value: '+' },
                        { label: 'Divide', value: '/' },
                        { label: 'Subtract', value: '-' },
                        { label: 'Modulus', value: '%' },
                        { label: 'Power', value: '^' }
                    ]}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>Value</Form.ControlLabel>
                <InputHandle id="secondvalue">
                    <InputNumber
                        name="secondvalue"
                        value={data.secondvalue}
                        onChange={v => this.onChange('secondvalue', v)}
                    />
                </InputHandle>
            </Form.Group>
        </>
    }
}