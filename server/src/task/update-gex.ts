import { DateTime } from "luxon";
import db from "../lib/mongo";
import polygon from "../lib/polygon";
import { getOpenStockHoldings, getStockPrice } from "../lib/stocks";
import { getOpenOptions } from "../lib/options";
import { getHolding } from "../lib/holdings";

export default async function updateGEX(): Promise<boolean> {

    //only do this once a day one hour before market open
    const now = DateTime.now().setZone("America/New_York");
    if (now.weekday > 5) return true; //only run on weekdays
    if (now.hour < 8 || now.hour > 16) return true; //only run during market hours
    if (now.minute < 25 || now.minute > 35) return true; //only run halfway through the hour

    const tickers = ["SPY", "QQQ", "IWM"];
    //add open holdings
    const holdings = await getOpenStockHoldings();
    for (const holding of holdings) {
        tickers.push(holding.ticker);
    }

    //add watchlist
    const watchlistCollection = db.collection('watchlist');
    const watchlist = await watchlistCollection.find({}).toArray();
    for (const item of watchlist) {
        tickers.push(item.ticker);
    }

    //add open options
    const openOptions = await getOpenOptions();
    for (const option of openOptions) {
        const holding = await getHolding(option.holding);
        tickers.push(holding.ticker);
    }

    //remove duplicates
    const uniqueTickers = [...new Set(tickers)];
    //const uniqueTickers = ["SPY"];

    const today = DateTime.now().setZone("UTC").toISODate() || "";

    for (const ticker of uniqueTickers) {
        console.log("Processing ticker", ticker);
        const price = await getStockPrice(ticker);

        //check if we need to update expirations (only need to update them once a day)
        const expirationCollection = db.collection('options-expirations');
        const expirationData = await expirationCollection.findOne({ ticker: ticker });
        let expirations = [];
        let updateExpirations = false;
        if (expirationData) {
            const updated = DateTime.fromISO(expirationData.updated);
            if (updated < DateTime.now().setZone("UTC").minus({ days: 1 })) {
                updateExpirations = true;
            } else {
                expirations = expirationData.expirations;
            }
        } else {
            updateExpirations = true;
        }

        if (updateExpirations) {
            const contracts = await polygon.reference.optionsContracts({
                underlying_ticker: ticker,
                "strike_price.gt": price - 10,
                "strike_price.lt": price + 10,
                limit: 1000
            });

            if (contracts.status != "OK") {
                console.error('Error getting contracts for', ticker);
                continue;
            }

            if (!contracts.results || contracts.results.length === 0) {
                console.warn('No contracts for', ticker);
                continue;
            }

            expirations = contracts.results.map((contract: any) => contract.expiration_date);
            const uniqueExpirations = [...new Set(expirations)];
            const nextExpiration = uniqueExpirations.sort().shift();

            //write expirations to db            
            await expirationCollection.findOneAndUpdate({ ticker: ticker }, { $set: { expirations: uniqueExpirations, updated: DateTime.now().setZone("UTC").toISO() } }, { upsert: true });
        }

        let nextExpiration = today;
        //make sure its a valid expiration, otherwise find the next one
        if (!expirations.includes(nextExpiration)) {
            const nextExpirations = expirations.filter((exp: string) => DateTime.fromISO(exp) >= DateTime.now().setZone("UTC").startOf('day'));
            nextExpiration = nextExpirations.sort().shift() || "";
        }

        if (!nextExpiration) {
            console.warn('No valid expiration for', ticker);
            continue;
        }

        const doneDates = [nextExpiration];

        console.log('Updating Gamma levels for', nextExpiration);

        await updateGammaLevels(ticker, nextExpiration);

        //find the weekly opex
        const nextExpirationDT = DateTime.fromISO(nextExpiration);
        if (nextExpirationDT.weekday !== 5) {
            const weeklyOpex = expirations.filter((exp: string) => DateTime.fromISO(exp).weekday == 5);
            let nextWeeklyOpex = today;
            //make sure its a valid expiration, otherwise find the next one
            if (!weeklyOpex.includes(nextWeeklyOpex)) {
                const nextExpirations = weeklyOpex.filter((exp: string) => DateTime.fromISO(exp) > DateTime.now().setZone("UTC"));
                nextWeeklyOpex = nextExpirations.sort().shift() || "";
            }

            if (!nextWeeklyOpex) {
                console.warn('No valid weekly expiration for', ticker);
                continue;
            }

            if (!doneDates.includes(nextWeeklyOpex)) {
                console.log('Updating Gamma levels for weekly opex', nextWeeklyOpex);
                await updateGammaLevels(ticker, nextWeeklyOpex);
                doneDates.push(nextWeeklyOpex);
            }
        }

        //find the monthly opex
        if (nextExpirationDT.weekday == 5 && nextExpirationDT.day > 14 && nextExpirationDT.day < 22) {
            //next expiration is the monthly opex
            continue;
        }
        const monthlyOpex = expirations.filter((exp: string) => {
            const expDT = DateTime.fromISO(exp);
            return expDT.weekday === 5 && expDT.day > 14 && expDT.day < 22;
        });
        let nextMonthlyOpex = today;
        //make sure its a valid expiration, otherwise find the next one
        if (!monthlyOpex.includes(nextMonthlyOpex)) {
            const nextExpirations = monthlyOpex.filter((exp: string) => DateTime.fromISO(exp) > DateTime.now().setZone("UTC"));
            nextMonthlyOpex = nextExpirations.sort().shift() || "";
        }

        if (!nextMonthlyOpex) {
            console.warn('No valid monthly expiration for', ticker);
            continue;
        }

        if (!doneDates.includes(nextMonthlyOpex)) {
            console.log('Updating Gamma levels for monthly opex', nextMonthlyOpex);
            await updateGammaLevels(ticker, nextMonthlyOpex);
            doneDates.push(nextMonthlyOpex);
        }
    }


    return true;
}

async function updateGammaLevels(ticker: string, date: string): Promise<boolean> {
    const price = await getStockPrice(ticker);
    const calls = await getOpenInterestGreeks(ticker, date, "call");
    const puts = await getOpenInterestGreeks(ticker, date, "put");

    const allOptions = [...calls, ...puts];
    const allDataPerStrike: {
        [strike: string]: {
            gexProfile: number,
            dexProfile: number,
            callGEX: number,
            putGEX: number,
            DEX: number
        }
    } = {};

    allOptions.sort((a, b) => a.strike - b.strike);

    allOptions.forEach(option => {
        const netGEX = option.oi * option.greeks.gamma * 100 * price;
        const netDEX = option.oi * option.greeks.delta * 100;
        if (!allDataPerStrike[option.strike]) {
            allDataPerStrike[option.strike] = {
                dexProfile: 0,
                gexProfile: 0,
                callGEX: 0,
                putGEX: 0,
                DEX: netDEX
            };
        } else {
            allDataPerStrike[option.strike].DEX += netDEX
        }
        if (option.type === "put") {
            allDataPerStrike[option.strike].putGEX = netGEX;
        } else {
            allDataPerStrike[option.strike].callGEX = netGEX;
        }
    });

    let callResistance = 0;
    let callResistanceStrike = 0;
    let putSupport = 0;
    let putSupportStrike = 0;
    let cumulativeGEX = 0;
    let cumulativeDEX = 0;
    let gammaFlipLevel: number | null = null;
    let peakGEX = 0;
    const allData = [];

    const strikes: string[] = Object.keys(allDataPerStrike).sort((a, b) => parseFloat(a) - parseFloat(b));

    for (const strike of strikes) {
        const data = allDataPerStrike[strike];
        if (parseFloat(strike) > price && data.callGEX > callResistance) {
            callResistance = data.callGEX;
            callResistanceStrike = parseInt(strike);
        }
        if (parseFloat(strike) < price && data.putGEX > putSupport) {
            putSupport = data.putGEX;
            putSupportStrike = parseInt(strike);
        }
        cumulativeGEX += data.callGEX - data.putGEX;
        cumulativeDEX += data.DEX;
        data.gexProfile = cumulativeGEX;
        data.dexProfile = cumulativeDEX;
        if (Math.abs(cumulativeGEX) > peakGEX) {
            peakGEX = Math.abs(cumulativeGEX);
            gammaFlipLevel = parseInt(strike);
        }
        allData.push({
            strike: parseFloat(strike),
            dexProfile: cumulativeDEX,
            gexProfile: cumulativeGEX,
            callGEX: data.callGEX,
            putGEX: data.putGEX
        });
    }

    const collection = db.collection('options-gamma');

    await collection.findOneAndUpdate({
        ticker: ticker,
        date: date
    }, {
        $set: {
            ticker: ticker,
            date: date,
            levels: {
                callResistance: callResistanceStrike,
                gammaFlip: gammaFlipLevel,
                putSupport: putSupportStrike
            },
            data: allData
        }
    }, {
        upsert: true
    });

    return true;
}

async function getOpenInterestGreeks(ticker: string, expiration: string, type: "call" | "put"): Promise<{ strike: number, type: string, oi: number, greeks: { delta: number, gamma: number, theta: number, vega: number } }[]> {
    try {
        const price = await getStockPrice(ticker);
        const floor = price * 0.9;
        const ceiling = price * 1.1;
        const gex = await polygon.options.snapshotOptionChain(ticker, {
            expiration_date: expiration,
            limit: 250,
            contract_type: type,
            "strike_price.gte": floor,
            "strike_price.lte": ceiling
        });

        if (gex.status != "OK") {
            console.error('Error getting details for', ticker, expiration);
            return [];
        }

        if (!gex.results || gex.results.length === 0) {
            console.warn('No results for', ticker, expiration);
            return [];
        }

        return gex.results.map((result: any) => ({
            strike: result.details.strike_price,
            type: result.details.contract_type,
            oi: result.open_interest,
            greeks: {
                delta: result.greeks.delta || 1,
                gamma: result.greeks.gamma || 0,
                theta: result.greeks.theta || 0,
                vega: result.greeks.vega || 0
            }
        }));
    } catch (error) {
        console.error('Error fetching open interest and greeks for', ticker, expiration, type, error);
        return [];
    }
}
