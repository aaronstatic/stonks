import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";
import EMA from "../../lib/indicator/EMA";

export default class EMANode extends BaseNode {
    inputs = [{
        name: 'Candles',
        type: 'candles'
    }];

    outputs = [{
        name: 'EMA',
        type: 'numberstream'
    }];

    process(params: Params, inputs: Inputs, _context: Inputs): Outputs {
        const length = params.length as number;
        const candles = inputs.Candles as Candle[];

        const ema = EMA(candles.map((c) => c.close), length);

        console.log("EMA Length", length);
        console.log("EMA", ema[ema.length - 1]);

        return {
            EMA: ema
        }
    }
}