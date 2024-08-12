import { DateTime } from "luxon";
import db from "../lib/mongo";
import { getNextExpiryGamma, getStockPrice } from "../lib/stocks";
import { sendToDiscord } from "../lib/discord";
import { getLatestIndexCandle } from "../lib/indices";

export default async function updateGamma(): Promise<boolean> {
    const collection = db.collection('gamma-1d');

    //only do this once a day at 8:30am NY time
    const now = DateTime.now().setZone("America/New_York");
    if (now.weekday > 5) return true;
    if (now.hour == 8 && now.minute > 25 && now.minute < 35) {
        await reportGamma("SPY");
        await reportGamma("QQQ");

        const vix = await getLatestIndexCandle("CBOE_DLY:VIX");
        console.log(vix);

        if (vix) {
            const vixLevel = vix.close;
            if (vixLevel > 50) {
                await sendToDiscord({
                    channel: "macro",
                    cmd: "msg",
                    message: `🔴 VIX is at ${vixLevel}, expect extreme volatility`
                });
            } else if (vixLevel > 30) {
                await sendToDiscord({
                    channel: "macro",
                    cmd: "msg",
                    message: `🔴 VIX is at ${vixLevel}, expect high volatility`
                });
            } else if (vixLevel > 20) {
                await sendToDiscord({
                    channel: "macro",
                    cmd: "msg",
                    message: `🟡 VIX is at ${vixLevel}, expect moderate volatility`
                });
            } else {
                await sendToDiscord({
                    channel: "macro",
                    cmd: "msg",
                    message: `🟢 VIX is at ${vixLevel}, expect low volatility`
                });
            }
        }
    }

    return true;
}

async function reportGamma(ticker: string) {
    const gamma = await getNextExpiryGamma(ticker);
    const price = await getStockPrice(ticker);

    let description = "";
    if (gamma.levels.gammaFlip < price) {
        description = `🟢 ${ticker} is in positive gamma`;
    } else {
        description = `🔴 ${ticker} is in negative gamma, beware of volatility`;
    }
    const date = DateTime.fromISO(gamma.date).toFormat("dd MMM yyyy");
    await sendToDiscord({
        channel: "macro",
        cmd: "embed",
        embed: {
            title: `${ticker} Gamma levels for ${date}`,
            description: description,
            fields: [
                {
                    name: "Spot Price",
                    value: price.toFixed(2)
                },
                {
                    name: "Call Resistance",
                    value: gamma.levels.callResistance.toFixed(2)
                },
                {
                    name: "Gamma Flip",
                    value: gamma.levels.gammaFlip.toFixed(2)
                },
                {
                    name: "Put Support",
                    value: gamma.levels.putSupport.toFixed(2)
                }
            ]
        }
    });
}