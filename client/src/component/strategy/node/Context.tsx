import { BaseNode, NodeData } from './BaseNode';

type ContextNodeData = NodeData & {

};

export default class ContextNode extends BaseNode<ContextNodeData> {
    static displayName = "Context";
    outputs = [{
        name: 'Candles',
        type: 'candles'
    }]
}