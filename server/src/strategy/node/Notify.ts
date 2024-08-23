import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

export default class NotifyNode extends BaseNode {
    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const trigger = inputs.Trigger as boolean;

        if (trigger) {
            console.log("Notification:", this.getMessage(params.message as string, context));
        }

        return {};
    }

    getMessage(message: string, context: Inputs) {
        return message.replace("${ticker}", context.Ticker);
    }
}