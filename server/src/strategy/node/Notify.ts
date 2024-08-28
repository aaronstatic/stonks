import { Candle } from "@schema/report/candles";
import BaseNode, { Inputs, Outputs, Params } from "./BaseNode";

import { sendNotification } from "../../lib/pushover";

export default class NotifyNode extends BaseNode {
    inputs = [{
        name: 'Trigger',
        type: 'trigger'
    }];

    process(params: Params, inputs: Inputs, context: Inputs): Outputs {
        const trigger = inputs.Trigger as boolean;

        if (trigger) {
            const message = this.getMessage(params.message as string, context);

            console.log("Notification:", this.getMessage(params.message as string, context));

            if (params.notify == "pushover") {
                sendNotification(message, context.User);
            }
        }

        return {};
    }

    getMessage(message: string, context: Inputs) {
        return message.replace("${ticker}", context.Ticker);
    }
}