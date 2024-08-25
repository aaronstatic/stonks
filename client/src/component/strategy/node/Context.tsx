import { BaseNode, NodeData } from './BaseNode';

type ContextNodeData = NodeData & {

};

export default class ContextNode extends BaseNode<ContextNodeData> {
    static displayName = "Context";
    outputs = [{
        name: 'Candles',
        type: 'candles'
    }, {
        name: 'Open',
        type: 'value'
    }, {
        name: 'High',
        type: 'value'
    }, {
        name: 'Low',
        type: 'value'
    }, {
        name: 'Close',
        type: 'value'
    }, {
        name: 'Volume',
        type: 'value'
    }]
}