import optionTradeRead from "./read/optiontrade";
import tradeRead from "./read/trade";
import transactionRead from "./read/transaction";
import optionTradeAfterWrite from "./write/optiontrade";
import tradeAfterWrite from "./write/trade";
import Object from "@schema/object";

type AsyncHandlerMapList = {
    [key: string]: (objects: any[]) => Promise<Object[]>;
}

type AsyncHandlerMap = {
    [key: string]: (object: any) => Promise<Object>;
}

export const ReadMap: AsyncHandlerMapList = {
    "transaction": transactionRead,
    "trade": tradeRead,
    "optiontrade": optionTradeRead
}

export const BeforeWriteMap: AsyncHandlerMap = {

}

export const AfterWriteMap: AsyncHandlerMap = {
    "trade": tradeAfterWrite,
    "optiontrade": optionTradeAfterWrite
}
