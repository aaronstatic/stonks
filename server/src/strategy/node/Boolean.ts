import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class BooleanNode extends BaseNode {
    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const operation = params.type as string;
        let trigger1 = inputs.Trigger1 as boolean;
        let trigger2 = inputs.Trigger2 as boolean;


        let result = false;
        switch (operation) {
            case "AND":
                result = trigger1 && trigger2;
                break;
            case "OR":
                result = trigger1 || trigger2;
                break;
            case "XOR":
                result = trigger1 !== trigger2;
                break;
            case "NAND":
                result = !(trigger1 && trigger2);
                break;
            case "NOR":
                result = !(trigger1 || trigger2);
                break;
            case "XNOR":
                result = trigger1 === trigger2;
                break;
        }

        return {
            True: result,
            False: !result
        }
    }
}