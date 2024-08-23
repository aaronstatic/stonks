import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class ConditionNode extends BaseNode {
    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const condition = params.type as string;
        let value = inputs.Value as (number[] | number);
        if (Array.isArray(value)) {
            value = value[value.length - 1];
        }

        const valueTest = params.value as number;

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