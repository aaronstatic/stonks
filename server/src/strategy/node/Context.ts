import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class ContextNode extends BaseNode {
    process(params: Params, data: Inputs, context: Inputs): Outputs {
        return context;
    }
}