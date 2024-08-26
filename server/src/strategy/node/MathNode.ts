import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class MathNode extends BaseNode {
    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const type = params.type as string;
        let value = inputs.Value as (number[] | number);
        if (Array.isArray(value)) {
            value = value[value.length - 1];
        }

        let secondValue = params.secondvalue as number;
        if (inputs.secondvalue) {
            if (Array.isArray(inputs.secondvalue)) {
                secondValue = inputs.secondvalue[inputs.secondvalue.length - 1] as number;
            } else {
                secondValue = inputs.secondvalue as number;
            }
        }

        let result = value;
        switch (type) {
            case "*":
                result = value * secondValue;
                break;
            case "/":
                result = value / secondValue;
                break;
            case "+":
                result = value + secondValue;
                break;
            case "-":
                result = value - secondValue;
                break;
            case "%":
                result = value % secondValue;
                break;
            case "^":
                result = Math.pow(value, secondValue);
                break;
        }

        return {
            Result: result
        }
    }
}