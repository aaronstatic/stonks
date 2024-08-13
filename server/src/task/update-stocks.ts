import { DateTime } from "luxon";
import db from "../lib/mongo";
import polygon from "../lib/polygon";
import { getOpenStockHoldings } from "../lib/stocks";
import finnhub from "../lib/finnhub";
import FileSystem from "fs";
import { getOpenOptions } from "../lib/options";
import { getHolding } from "../lib/holdings";

export const sectorFunds = [
    "CIBR",
    "CQQQ",
    "GDX",
    "IBB",
    "IGV",
    "ITA",
    "ITB",
    "IWM",
    "SPY",
    "KIE",
    "KRE",
    "MOO",
    "PBW",
    "QQQ",
    "SMH",
    "TAN",
    "VNQ",
    "XHB",
    "XLB",
    "XLC",
    "XLE",
    "XLF",
    "XLI",
    "XLK",
    "XLP",
    "XLRE",
    "XLU",
    "XLV",
    "XLY",
    "XME",
    "DIA"
]

export default async function updateStocks(): Promise<boolean> {
    const now = DateTime.now().setZone("America/New_York");
    if (now.weekday > 5) return true; //only run on weekdays
    if (now.hour < 4 || now.hour > 20) return true; //only run during market hours 

    const collection = db.collection('stocks-1d');
    const detailCollection = db.collection('stocks-detail');
    const earningsCollection = db.collection('stocks-earnings');
    const financialsCollection = db.collection('stocks-financials');
    const dividendCollection = db.collection('stocks-dividends');

    const allHoldings = await db.collection('holding').find({
        type: "Stock"
    }).toArray();
    const tickers = allHoldings.map(holding => holding.ticker);

    const uniqueTickers = [...new Set(tickers)];

    //add open options
    const openOptions = await getOpenOptions();
    for (const option of openOptions) {
        const holding = await getHolding(option.holding);
        if (holding && !uniqueTickers.includes(holding.ticker)) {
            uniqueTickers.push(holding.ticker);
        }
    }

    //add watchlist
    const watchlist = await db.collection('watchlist').find({}).toArray();
    for (const item of watchlist) {
        if (!uniqueTickers.includes(item.ticker)) {
            uniqueTickers.push(item.ticker);
        }
    }

    //add sector funds
    for (const fund of sectorFunds) {
        if (!uniqueTickers.includes(fund)) {
            uniqueTickers.push(fund);
        }
    }

    for (const ticker of uniqueTickers) {
        //Update candles
        const last = await collection.findOne({ ticker: ticker }, { sort: { timestamp: -1 } });

        const startOfYear = DateTime.now().startOf('year');
        const from = last ? DateTime.fromISO(last.timestamp) : startOfYear;
        const to = DateTime.now();

        console.log('Updating', ticker, 'from', from.toISO(), 'to', to.toISO());
        const candles = await polygon.stocks.aggregates(
            ticker,
            1,
            'day',
            from.toMillis().toString(),
            to.toMillis().toString()
        );
        if (!candles.results) {
            console.log('No results for', ticker);
            continue;
        }
        for (const candle of candles.results) {
            if (!candle.t) continue;
            const timestamp = DateTime.fromMillis(candle.t).toISO();
            await collection.findOneAndUpdate({
                ticker: ticker,
                timestamp: timestamp
            }, {
                $set: {
                    ticker: ticker,
                    timestamp: timestamp,
                    open: candle.o,
                    high: candle.h,
                    low: candle.l,
                    close: candle.c,
                    volume: candle.v
                }
            }, {
                upsert: true
            });
        }

        //update details
        let stockType = "CS";
        const existing = await detailCollection.findOne({ ticker: ticker });
        let needToUpdate = false;
        if (!existing) {
            needToUpdate = true;
        } else {
            if (existing.type)
                stockType = existing.type;
            const lastUpdate = DateTime.fromISO(existing.lastUpdate);
            if (lastUpdate.diffNow('days').days > 1) {
                needToUpdate = true;
            }
            const dividends = await dividendCollection.findOne({ ticker: ticker });
            if (!dividends) {
                needToUpdate = true;
            }
        }
        if (needToUpdate) {
            console.log("Updating details for", ticker);
            const details = await polygon.reference.tickerDetails(ticker);

            if (!details.results) {
                console.log("No details for", ticker);
                continue;
            }

            let logo = "";

            if (details.results.type)
                stockType = details.results.type;

            if (details.results.branding && details.results.branding.logo_url) {
                //get filename
                const extension = details.results.branding.logo_url.split('.').pop();
                const filename = `${ticker}.${extension}`;

                //check if we downloaded it already
                const logoLocation = `${process.env.LOGO_PATH}/stocks/${filename}`;
                const distLocation = `${process.env.LOGO_DIST_PATH}/stocks/${filename}`;
                const logoExists = FileSystem.existsSync(logoLocation);
                if (!logoExists) {
                    console.log("Fetching Logo for", ticker);
                    FileSystem.mkdirSync(`${process.env.LOGO_PATH}/stocks`, { recursive: true });
                    const logo = await fetch(details.results.branding.logo_url + "?apiKey=" + process.env.POLYGON_API_KEY);
                    const logoData = await logo.arrayBuffer();
                    FileSystem.writeFileSync(logoLocation, Buffer.from(logoData));

                    //copy to dist
                    FileSystem.mkdirSync(`${process.env.LOGO_DIST_PATH}/stocks`, { recursive: true });
                    FileSystem.copyFileSync(logoLocation, distLocation);
                }
                logo = `/logos/stocks/${filename}`;
            }

            const toInsert: any = {
                ...details.results,
                lastUpdate: DateTime.now().toISO()
            }

            if (logo != "") {
                toInsert.logo = logo;
            }

            await detailCollection.findOneAndUpdate({ ticker: ticker }, {
                $set: toInsert
            }, {
                upsert: true
            });

            //update earnings
            const from = DateTime.now().startOf('year');
            const to = DateTime.now().endOf('year');
            const earnings = await finnhub.earningsCalendar(from.toFormat("yyyy-MM-dd"), to.toFormat("yyyy-MM-dd"), ticker);

            if (!earnings.data.earningsCalendar) {
                console.log("No earnings for", ticker);
                continue;
            }

            for (const earning of earnings.data.earningsCalendar) {
                const toInsert = {
                    ...earning,
                    ticker: ticker
                }

                await earningsCollection.findOneAndUpdate({
                    ticker: ticker,
                    quarter: earning.quarter,
                    year: earning.year
                }, {
                    $set: toInsert
                }, {
                    upsert: true
                });
            }

            //Update dividends
            console.log("Updating dividends for", ticker);
            const dividends = await polygon.reference.dividends({
                ticker: ticker
            });
            if (dividends.results) {
                for (const dividend of dividends.results) {
                    const existing = await dividendCollection.findOne({ ticker: ticker, ex_dividend_date: dividend.ex_dividend_date });
                    if (!existing) {
                        await dividendCollection.insertOne({
                            ...dividend
                        });
                    }
                }
            }
        }

        if (stockType != "ETF" && stockType != "REIT" && stockType != "ETV") {
            //update financials
            const existingFinancials = await financialsCollection.findOne({ ticker: ticker });
            let needToUpdateFinance = false;
            if (!existingFinancials) {
                needToUpdateFinance = true;
            } else {
                const lastUpdate = DateTime.fromISO(existingFinancials.lastUpdate);
                if (lastUpdate.diffNow('days').days > 7) {
                    needToUpdateFinance = true;
                }
            }

            if (needToUpdateFinance) {
                console.log("Updating financials for", ticker);
                const financials = await polygon.reference.stockFinancials({
                    ticker: ticker,
                    limit: 1
                });

                if (!financials.results || financials.results.length == 0) {
                    console.log("No financials for", ticker);
                    continue;
                }

                const toInsert = {
                    ...financials.results[0],
                    ticker: ticker,
                    lastUpdate: DateTime.now().toISO()
                }

                await financialsCollection.findOneAndUpdate({ ticker: ticker }, {
                    $set: toInsert
                }, {
                    upsert: true
                });
            }

        }
    }


    return true;
}