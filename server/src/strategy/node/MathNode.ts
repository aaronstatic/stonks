import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class MathNode extends BaseNode {

    inputs = [{
        name: 'Value',
        type: 'number'
    }, {
        name: 'secondvalue',
        type: 'number'
    }];

    outputs = [{
        name: 'Result',
        type: 'number'
    }];

    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const type = params.type as string;
        let value = inputs.Value as number;

        let secondValue = params.secondvalue as number;
        if (inputs.secondvalue) {
            secondValue = inputs.secondvalue as number;
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