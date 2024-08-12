import { DateTime } from "luxon";
import db from "../lib/mongo";
import { getNextExpiryGamma, getStockPrice } from "../lib/stocks";
import { sendToDiscord } from "../lib/discord";
import { getLatestIndexCandle } from "../lib/indices";

import { Chart } from "chart.js/auto";
import { createCanvas } from "canvas";
import annotationPlugin from "chartjs-plugin-annotation";
import datalabelPlugin from "chartjs-plugin-datalabels";

import fs from "fs";

export default async function updateGamma(): Promise<boolean> {
    const collection = db.collection('gamma-1d');

    //only do this once a day at 8:30am NY time
    const now = DateTime.now().setZone("America/New_York");
    if (now.weekday > 5) return true;
    if (now.hour == 8 && now.minute > 25 && now.minute < 35) {
        await reportGammaChart("SPY");
        await reportGamma("SPY");
        await reportGammaChart("QQQ");
        await reportGamma("QQQ");

        const vix = await getLatestIndexCandle("CBOE_DLY:VIX");

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

async function reportGammaChart(ticker: string) {
    const gamma = await getNextExpiryGamma(ticker);
    const spotPrice = await getStockPrice(ticker);

    const canvas = createCanvas(912, 500);
    const ctx = canvas.getContext("2d");

    //fill background
    ctx.fillStyle = "#17161C";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    (ctx as any).canvas = canvas;
    const context = ctx as any as CanvasRenderingContext2D;

    const labels = [];
    const callGEX = [];
    const putGEX = [];
    const GEXProfile = [];

    for (const strike of gamma.data) {
        labels.push(strike.strike);
        callGEX.push(strike.callGEX);
        putGEX.push(-strike.putGEX);
        GEXProfile.push(strike.gexProfile / 10);
    }

    const date = DateTime.fromISO(gamma.date).toFormat("dd MMM yyyy");

    Chart.register(annotationPlugin);
    Chart.register(datalabelPlugin, {
        id: "background",
        beforeDraw: (chart: any) => {
            const ctx = chart.ctx;
            ctx.save();
            ctx.fillStyle = "rgba(23, 22, 27, 1)";
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore
        }
    });

    const spotStrike = labels.reduce((prev, curr) => Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev);
    const spotIndex = labels.indexOf(spotStrike);
    const diff = spotPrice - spotStrike;
    let delta = 0;
    if (diff < 0) {
        delta = diff / (labels[spotIndex] - labels[spotIndex - 1])
    } else if (diff > 0) {
        delta = diff / (labels[spotIndex + 1] - labels[spotIndex])
    }
    const spotIndexDiff = spotIndex + delta;

    const chart = new Chart(context, {
        type: "bar",
        options: {
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `NET GEX for ${ticker} ${date}`,
                },
                datalabels: {
                    display: false
                },
                annotation: {
                    annotations: {
                        price: {
                            drawTime: 'beforeDatasetsDraw',
                            type: 'line',
                            xMin: spotIndex,
                            xMax: spotIndex,
                            borderColor: 'rgba(255,255,255,0.5)',
                            borderDash: [5, 5]
                        },
                        callResistance: {
                            drawTime: 'beforeDatasetsDraw',
                            type: 'line',
                            xMin: labels.indexOf(gamma.levels.callResistance),
                            xMax: labels.indexOf(gamma.levels.callResistance),
                            borderColor: 'rgba(88, 177, 91, 0.5)',
                            borderDash: [5, 5]
                        },
                        putSupport: {
                            drawTime: 'beforeDatasetsDraw',
                            type: 'line',
                            xMin: labels.indexOf(gamma.levels.putSupport),
                            xMax: labels.indexOf(gamma.levels.putSupport),
                            borderColor: 'rgba(240, 79, 67, 0.5)',
                            borderDash: [5, 5]
                        },
                        negativeGamma: {
                            drawTime: 'beforeDatasetsDraw',
                            type: "box",
                            xMin: 0,
                            xMax: labels.indexOf(gamma.levels.gammaFlip),
                            backgroundColor: "rgba(240, 79, 67, 0.1)",
                            label: {
                                display: true,
                                color: "rgba(240, 79, 67, 0.7)",
                                content: "Negative Gamma",
                                position: "end",
                                textAlign: "center"
                            }
                        },
                        positiveGamma: {
                            drawTime: 'beforeDatasetsDraw',
                            type: "box",
                            xMin: labels.indexOf(gamma.levels.gammaFlip),
                            xMax: labels.length,
                            backgroundColor: "rgba(88, 177, 91, 0.1)",
                            label: {
                                display: true,
                                color: "rgba(88, 177, 91, 0.7)",
                                content: "Positive Gamma",
                                position: "start",
                                textAlign: "center"
                            }
                        }
                    }
                }
            },

            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    display: false,
                    stacked: true
                }
            }
        },
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Call GEX",
                    data: callGEX,
                    backgroundColor: "rgba(88, 177, 91, 1);"
                },
                {
                    label: "Put GEX",
                    data: putGEX,
                    backgroundColor: "rgba(240, 79, 67, 1);",
                },
                {
                    label: "GEX Profile",
                    data: GEXProfile,
                    borderColor: "rgba(255,255,0,0.3);",
                    backgroundColor: "rgba(255,255,0,0.3);",
                    type: "line",
                    pointRadius: 0,
                    borderWidth: 1
                }
            ]
        }
    });

    const buffer = canvas.toBuffer("image/png");
    //save to disk
    if (!process.env.GAMMA_PATH) return;

    fs.mkdirSync(process.env.GAMMA_PATH, { recursive: true });
    const location = process.env.GAMMA_PATH + "/" + ticker + ".png";
    fs.writeFileSync(location, buffer);

    await sendToDiscord({
        channel: "macro",
        cmd: "img",
        image: location
    });
}