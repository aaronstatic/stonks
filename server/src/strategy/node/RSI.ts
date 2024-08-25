import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";
import RSI from "../../lib/indicator/RSI";

export default class RSINode extends BaseNode {
    process(params: Params, inputs: Inputs, _context: Inputs): Outputs {
        const rsiLength = params.length as number;
        const candles = inputs.Candles as Candle[];

        const rsi = RSI(candles.map((c) => c.close), rsiLength);

        console.log("RSI", rsi[rsi.length - 1]);

        return {
            RSI: rsi
        }
    }
}