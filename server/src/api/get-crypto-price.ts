import { getCryptoPrice } from "../lib/crypto";

export default async function getCryptoPriceAPI(data: { owner: string, ticker: string }): Promise<number> {
    return await getCryptoPrice(data.ticker);
}