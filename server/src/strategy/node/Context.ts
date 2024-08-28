import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class ContextNode extends BaseNode {
    outputs = [{
        name: "Candles",
        type: "candles"
    }, {
        name: "Open",
        type: "number"
    }, {
        name: "Close",
        type: "number"
    }, {
        name: "High",
        type: "number"
    }, {
        name: "Low",
        type: "number"
    }, {
        name: "Volume",
        type: "number"
    }];

    process(params: Params, data: Inputs, context: Inputs): Outputs {
        return context;
    }
}