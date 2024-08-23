import { BaseNode, NodeData } from './BaseNode';
import { Form, InputNumber, InputPicker } from 'rsuite';

type ConditionNodeData = NodeData & {
    type: string,
    value: number
};

export default class RSINode extends BaseNode<ConditionNodeData> {
    static displayName = "Condition";

    defaultValues = {
        name: "Condition",
        type: ">",
        value: 0
    }

    inputs = [{
        name: 'Value',
        type: 'number'
    }]

    outputs = [{
        name: 'True',
        type: 'trigger'
    }, {
        name: 'False',
        type: 'trigger'
    }]

    renderForm(data: ConditionNodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>Condition</Form.ControlLabel>
                <InputPicker
                    name="type"
                    value={data.type}
                    onChange={v => this.onChange('type', v)}
                    cleanable={false}
                    data={[
                        { label: '>', value: '>' },
                        { label: '<', value: '<' },
                        { label: '=', value: '=' },
                        { label: '!=', value: '!=' },
                        { label: '>=', value: '>=' },
                        { label: '<=', value: '<=' }
                    ]}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>Value</Form.ControlLabel>
                <InputNumber
                    name="value"
                    value={data.value}
                    onChange={v => this.onChange('value', v)}
                />
            </Form.Group>
        </>
    }
}