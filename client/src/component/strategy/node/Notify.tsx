import { BaseNode, NodeData, ValueType } from './BaseNode';
import { Form, Input, InputPicker } from 'rsuite';

type NotifyNodeData = NodeData & {
    notify: string
    message: string
};

export default class RSINode extends BaseNode<NotifyNodeData> {
    static displayName = "Notify";

    defaultValues = {
        name: "Notify",
        notify: "pushbullet",
        message: "${ticker} has triggered a condition"
    }

    static inputs = [{
        name: 'Trigger',
        type: ValueType.trigger
    }]

    inputs = RSINode.inputs;

    renderForm(data: NotifyNodeData) {
        return <>
            <Form.Group>
                <Form.ControlLabel>Notify</Form.ControlLabel>
                <InputPicker
                    name="notify"
                    value={data.notify}
                    onChange={v => this.onChange('notify', v)}
                    cleanable={false}
                    data={[
                        { label: 'Pushover', value: 'pushover' },
                        { label: 'Discord', value: 'discord' }
                    ]}
                />
            </Form.Group>
            <Form.Group>
                <Form.ControlLabel>Message</Form.ControlLabel>
                <Input
                    as="textarea"
                    name="message"
                    rows={5}
                    value={data.message}
                    onChange={v => this.onChange('message', v)}
                />
            </Form.Group>
        </>
    }
}