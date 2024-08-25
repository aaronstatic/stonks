import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";
import StochasticRSI from "../../lib/indicator/StochasticRSI";

export default class StochasticRSINode extends BaseNode {
    process(params: Params, inputs: Inputs, _context: Inputs): Outputs {
        const smoothK = params.k as number;
        const smoothD = params.d as number;
        const rsiLength = params.length as number;
        const stochLength = params.lengthStoch as number;
        const candles = inputs.Candles as Candle[];

        const rsi = StochasticRSI(candles.map(c => c.close), smoothK, smoothD, rsiLength, stochLength);

        console.log("Stochastic RSI", rsi[rsi.length - 1]);

        let crossUp = false;
        let crossDown = false;

        if (rsi.length > 1) {
            const current = rsi[rsi.length - 1];
            const previous = rsi[rsi.length - 2];
            crossUp = current.k > current.d && previous.k <= previous.d;
            crossDown = current.k < current.d && previous.k >= previous.d;
        }

        return {
            K: rsi.map((r) => r.k),
            D: rsi.map((r) => r.d),
            CrossUp: crossUp,
            CrossDown: crossDown
        }
    }
}