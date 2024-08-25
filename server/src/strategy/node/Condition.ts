import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class ConditionNode extends BaseNode {
    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const condition = params.type as string;
        let value = inputs.Value as (number[] | number);
        if (Array.isArray(value)) {
            value = value[value.length - 1];
        }

        let valueTest = params.testvalue as number;
        if (inputs.testvalue) {
            if (Array.isArray(inputs.testvalue)) {
                valueTest = inputs.testvalue[inputs.testvalue.length - 1] as number;
            } else {
                valueTest = inputs.testvalue as number;
            }

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