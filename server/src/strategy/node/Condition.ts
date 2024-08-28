import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class ConditionNode extends BaseNode {
    inputs = [{
        name: 'Value',
        type: 'number'
    }, {
        name: 'testvalue',
        type: 'number'
    }];

    outputs = [{
        name: 'True',
        type: 'trigger'
    }, {
        name: 'False',
        type: 'trigger'
    }];

    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const condition = params.type as string;
        let value = inputs.Value as number;

        let valueTest = params.testvalue as number;
        if (inputs.testvalue) {
            valueTest = inputs.testvalue as number;
        }

        let result = false;
        switch (condition) {
            case ">":
                result = value > valueTest;
                break;
            case ">=":
                result = value >= valueTest;
                break;
            case "<":
                result = value < valueTest;
                break;
            case "<=":
                result = value <= valueTest;
                break;
            case "=":
                result = value === valueTest;
                break;
            case "!=":
                result = value !== valueTest;
                break;
        }

        return {
            True: result,
            False: !result
        }
    }
}