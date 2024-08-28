import { BaseNode, NodeData, ValueType } from './BaseNode';
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

    static inputs = [{
        name: 'Value',
        type: ValueType.number
    }]

    static outputs = [{
        name: 'Result',
        type: ValueType.number
    }]

    static formInputs = [{
        name: 'secondvalue',
        type: ValueType.number
    }]

    inputs = MathNode.inputs;
    outputs = MathNode.outputs;
    formInputs = MathNode.formInputs;

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
                <InputHandle id="secondvalue" parentId={this.props.id} valueType={ValueType.number}>
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