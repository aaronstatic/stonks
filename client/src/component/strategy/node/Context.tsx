import { BaseNode, NodeData, ValueType } from './BaseNode';

type ContextNodeData = NodeData & {

};

export default class ContextNode extends BaseNode<ContextNodeData> {
    static displayName = "Context";
    static outputs = [{
        name: 'Candles',
        type: ValueType.candles
    }, {
        name: 'Open',
        type: ValueType.number
    }, {
        name: 'High',
        type: ValueType.number
    }, {
        name: 'Low',
        type: ValueType.number
    }, {
        name: 'Close',
        type: ValueType.number
    }, {
        name: 'Volume',
        type: ValueType.number
    }]

    outputs = ContextNode.outputs;
}