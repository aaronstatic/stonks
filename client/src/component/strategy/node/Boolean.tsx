import { BaseNode, NodeData } from './BaseNode';
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

    inputs = [{
        name: 'Trigger 1',
        id: 'Trigger1',
        type: 'trigger'
    }, {
        name: 'Trigger 2',
        id: 'Trigger2',
        type: 'trigger'
    }]

    outputs = [{
        name: 'True',
        type: 'trigger'
    }, {
        name: 'False',
        type: 'trigger'
    }]

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