import { BaseNode, NodeData, ValueType } from './BaseNode';
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

    static inputs = [{
        name: 'Value',
        type: ValueType.number
    }]

    static outputs = [{
        name: 'True',
        type: ValueType.trigger
    }, {
        name: 'False',
        type: ValueType.trigger
    }]

    static formInputs = [{
        name: 'testvalue',
        type: ValueType.number
    }]

    inputs = RSINode.inputs;
    outputs = RSINode.outputs;
    formInputs = RSINode.formInputs;

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
                <InputHandle
                    id="testvalue"
                    parentId={this.props.id}
                    valueType={ValueType.number}
                >
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