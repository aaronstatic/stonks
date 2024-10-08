import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";
import HawkesVolatility from "../../lib/indicator/HawkesVolatility";
import ATR from "../../lib/indicator/ATR";

export default class HawkesVolatilityNode extends BaseNode {
    inputs = [{
        name: 'Candles',
        type: 'candles'
    }];

    outputs = [{
        name: 'Hawkes',
        type: 'numberstream'
    }, {
        name: 'Quantile95',
        type: 'numberstream'
    }, {
        name: 'Quantile05',
        type: 'numberstream'
    }, {
        name: 'ATR',
        type: 'numberstream'
    }, {
        name: 'CrossUp',
        type: 'trigger'
    }, {
        name: 'CrossDown',
        type: 'trigger'
    }];

    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const candles = inputs.Candles as Candle[];
        const kappa = params.kappa as number;
        const atrLength = params.atrLength as number;
        const quantileLength = params.quantileLength as number;

        const hawkes = HawkesVolatility(candles, kappa, atrLength, quantileLength);

        console.log("Hawkes Volatility", hawkes[hawkes.length - 1]);

        let crossUp = false;
        let crossDown = false;

        if (hawkes.length > 1) {
            const current = hawkes[hawkes.length - 1];
            const previous = hawkes[hawkes.length - 2];
            crossUp = current.hawkes > current.quantile95 && previous.hawkes <= previous.quantile95;
            crossDown = current.hawkes < current.quantile95 && previous.hawkes >= previous.quantile95;
        }

        return {
            Hawkes: hawkes.map((h) => h.hawkes),
            Quantile95: hawkes.map((h) => h.quantile95),
            Quantile05: hawkes.map((h) => h.quantile05),
            ATR: hawkes.map((h) => h.atr),
            CrossUp: crossUp,
            CrossDown: crossDown
        }
    }
}