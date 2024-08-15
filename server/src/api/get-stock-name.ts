import { getStockName } from "../lib/stocks";

export default async function getStockNameAPI(data: { owner: string, ticker: string }): Promise<string> {
    return await getStockName(data.ticker, true);
}