import { getStockPrice } from "../lib/stocks";

export default async function getStockPriceAPI(data: { owner: string, ticker: string }): Promise<number> {
    return await getStockPrice(data.ticker, "", true);
}