import { Handle, Position } from '@xyflow/react';
import { BaseNode, NodeData } from './BaseNode';
import { Form, InputNumber, InputPicker } from 'rsuite';
import InputHandle from '../InputHandle';

type ConditionNodeData = NodeData & {
    type: string,
    testvalue: number
};

export default class RSINode extends BaseNode<ConditionNodeData> {
    static displayName = "Condition";

    defaultValues = {
        name: "Condition",
        type: ">",
        testvalue: 0
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
                <Form.ControlLabel>Test Value</Form.ControlLabel>
                <InputHandle id="testvalue">
                    <InputNumber
                        name="testvalue"
                        value={data.testvalue}
                        onChange={v => this.onChange('testvalue', v)}
                    />
                </InputHandle>
            </Form.Group>
        </>
    }
}