import { BaseNode, NodeData, ValueType } from './BaseNode';
import { Form, InputPicker } from 'rsuite';

type BooleanNodeData = NodeData & {
    type: string
};

export default class BooleanNode extends BaseNode<BooleanNodeData> {
    static displayName = "Boolean";

    defaultValues = {
        name: "Boolean",
        type: "AND"
    }

    static inputs = [{
        name: 'Trigger 1',
        id: 'Trigger1',
        type: ValueType.trigger
    }, {
        name: 'Trigger 2',
        id: 'Trigger2',
        type: ValueType.trigger
    }]

    static outputs = [{
        name: 'True',
        type: ValueType.trigger
    }, {
        name: 'False',
        type: ValueType.trigger
    }]

    inputs = BooleanNode.inputs;
    outputs = BooleanNode.outputs;

    renderForm(data: BooleanNodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>Operation</Form.ControlLabel>
                <InputPicker
                    name="type"
                    value={data.type}
                    onChange={v => this.onChange('type', v)}
                    cleanable={false}
                    data={[
                        { label: 'AND', value: 'AND' },
                        { label: 'OR', value: 'OR' },
                        { label: 'XOR', value: 'XOR' },
                        { label: 'NAND', value: 'NAND' },
                        { label: 'NOR', value: 'NOR' },
                        { label: 'XNOR', value: 'XNOR' }
                    ]}
                />
            </Form.Group>
        </>
    }
}