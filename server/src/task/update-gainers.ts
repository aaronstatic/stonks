import { DateTime } from "luxon";
import db from "../lib/mongo";
import polygon from "../lib/polygon";
import { sendToDiscord } from "../lib/discord";

export default async function updateGainers(): Promise<boolean> {
    //only do this once a day at 9am NY time
    const now = DateTime.now().setZone("America/New_York");
    if (now.weekday > 5) return true;
    if (now.hour == 9 && now.minute >= 0 && now.minute < 5) {
        const gainers = await polygon.stocks.snapshotGainersLosers("gainers");

        if (!gainers) return true;
        if (!gainers.tickers) return true;
        if (gainers.tickers.length == 0) return true;

        let text = "";
        let num = 0;
        for (const stock of gainers.tickers) {
            if (num > 4) break;
            text += `**${stock.ticker}** +${stock.todaysChangePerc?.toFixed(2)}%\n`;
            num++;
        }

        await sendToDiscord({
            channel: "macro",
            cmd: "msg",
            message: `🚀 Top Pre-Market Gainers\n\n${text}`
        });
    }

    return true;
}