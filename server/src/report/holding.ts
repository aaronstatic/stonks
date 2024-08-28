import Holding from "@schema/holding";
import db from "../lib/mongo";
import { HoldingReport } from "@schema/report/holding";
import { getCryptoDayCandle } from "../lib/crypto";
import { DateTime } from "luxon";
import { getExchangeRate } from "../lib/currency";
import { getDayChange, getNextExpiryGammaZone, getStockDayCandle, getStockPrice, sortEvent } from "../lib/stocks";
import Option from "@schema/option";
import { castHolding, getHolding } from "../lib/holdings";
import { castOption, getOpenOptionSnapshot, getOptionDayCandle, getOptionDayChange, getOptionName, getOptionPrice, getOptionTicker } from "../lib/options";
import { ObjectId } from "mongodb";

import { bondStocks } from "./dashboard";

export default async function holdingReport(owner: string = "", params: any = {}): Promise<HoldingReport | null> {
    const ticker: string = params.ticker;
    const type: string = params.type;

    const toDateDT = params.toDate ? DateTime.fromISO(params.toDate) : DateTime.now().setZone("UTC");

    if (type != "Option") {
        const doc = await db.collection('holding').findOne({ owner: owner, ticker: ticker });
        if (doc == null) {
            console.log("Cannot find holding", ticker);
            return null;
        }
        const holding = castHolding(doc);

        if (holding.type == "Stock") {
            return await stockHolding(holding, toDateDT);
        } else if (holding.type == "Crypto") {
            return await cryptoHolding(holding, toDateDT);
        }
    } else {
        const doc = await db.collection('option').findOne({ owner: owner, _id: new ObjectId(ticker) });
        if (doc == null) {
            return null;
        }
        const option = castOption(doc);
        return await optionHolding(option, toDateDT);
    }
    return null;
}

async function stockHolding(holding: Holding, toDateDT: DateTime): Promise<HoldingReport> {
    const trades = await db.collection('trade').find({ holding: holding._id.toString() }).toArray();
    trades.sort(sortEvent);

    let quantity = 0;
    let cost = 0;
    let averageOpenPrice = 0;
    let today = 0;
    let realized = 0;
    let realizedfy = 0;

    const startOfDay = toDateDT.toUTC().startOf('day');
    const endOfDay = startOfDay.endOf('day');
    let startOfFinancialYear = toDateDT.minus({ years: 1 }).set({ month: 7, day: 1 }).startOf('day');
    if (startOfDay.month >= 7) startOfFinancialYear = toDateDT.set({ month: 7, day: 1 }).startOf('day');
    const endOfFinancialYear = startOfFinancialYear.plus({ years: 1 }).minus({ days: 1 }).endOf('day');
    const dayChange = await getDayChange(holding.ticker, toDateDT.toISODate() || "");
    const todayCandle = await getStockDayCandle(holding.ticker, toDateDT.toISODate() || "", false);

    const price = await getStockPrice(holding.ticker, toDateDT.toISODate() || "");
    let qtyToday = 0;

    for (const trade of trades) {
        const time = DateTime.fromISO(trade.timestamp).toUTC();
        if (time > toDateDT) {
            break;
        }
        if (trade.type === 'BUY') {
            quantity += trade.quantity;
            cost += (trade.price * trade.quantity) + trade.fees;
            if (time > startOfDay && time < endOfDay && todayCandle) {
                const sinceChange = todayCandle.close - trade.price;
                today += trade.quantity * sinceChange;
                qtyToday += trade.quantity;
            }
        } else {
            if (time > startOfFinancialYear && time < endOfFinancialYear) {
                realizedfy += (trade.price * trade.quantity) - (averageOpenPrice * trade.quantity);
            }
            realized += (trade.price * trade.quantity) - (averageOpenPrice * trade.quantity);
            quantity -= trade.quantity;
            cost -= (averageOpenPrice * trade.quantity);
            if (time > startOfDay && time < endOfDay && todayCandle) {
                const sinceChange = trade.price - todayCandle.open;
                today += trade.quantity * sinceChange;
            }
        }
        averageOpenPrice = cost / quantity;
    }

    today += (quantity - qtyToday) * dayChange;

    let holdingType = holding.type;
    if (bondStocks.includes(holding.ticker)) {
        holdingType = "Bonds";
    }

    let valueMainCurrency = 0;
    let costMainCurrency = 0;

    const value = quantity * price;
    let unrealized = value - cost;

    const user = await db.collection('users').findOne({
        _id: new ObjectId(holding.owner)
    });
    let currency = "USD";

    if (user) {
        currency = user.currency;
    }

    if (holding.currency != currency) {
        const exchangeRate = await getExchangeRate(holding.currency + currency);

        costMainCurrency = exchangeRate * cost;
        valueMainCurrency = exchangeRate * value;
        today = exchangeRate * today;
        unrealized = exchangeRate * unrealized;
        realized = exchangeRate * realized;
        realizedfy = exchangeRate * realizedfy;
    } else {
        costMainCurrency = cost;
        valueMainCurrency = value;
    }

    const earnings = await db.collection('stocks-earnings').find({ ticker: holding.ticker }).toArray();
    let nextEarnings = "";
    let nextEarningsTime = "";
    let earliest = DateTime.now().plus({ years: 10 }).toMillis();
    const now = DateTime.now();
    for (const earning of earnings) {
        const time = DateTime.fromISO(earning.date);
        const millis = time.toMillis();
        if (time > now && millis < earliest) {
            earliest = millis;
            nextEarnings = time.toISO() || "";
            nextEarningsTime = earning.hour
        }
    }

    //add any options
    const options = await db.collection("option").find({ owner: holding.owner, holding: holding._id.toString() }).toArray();
    for (const doc of options) {
        const option = castOption(doc);
        const optionReport = await optionHolding(option, toDateDT);

        today += optionReport.today;
        unrealized += optionReport.unrealized;
        realized += optionReport.realized;
        valueMainCurrency += optionReport.value;
        costMainCurrency += optionReport.cost;
    }

    let lastDividend = "";
    let lastDividendAmount = 0;
    let nextDividend = "";
    let nextDividendAmount = 0;
    const dividends = await db.collection('stocks-dividends').find({ ticker: holding.ticker }).toArray();
    let lastDividendMillis = DateTime.now().minus({ months: 5 }).toMillis();
    let nextDividendMillis = DateTime.now().toMillis();

    for (const dividend of dividends) {
        const time = DateTime.fromISO(dividend.ex_dividend_date + "T12:00:00Z");
        const millis = time.toMillis();
        if (time < now && millis > lastDividendMillis) {
            lastDividendMillis = millis;
            lastDividend = time.toISODate() || "";
            lastDividendAmount = dividend.cash_amount;
        }
        if (time > now && millis < nextDividendMillis) {
            nextDividendMillis = millis;
            nextDividend = time.toISODate() || "";
            nextDividendAmount = dividend.cash_amount;
        }
    }

    const gammaZone = await getNextExpiryGammaZone(holding.ticker);

    return {
        lastDividend: lastDividend,
        lastDividendAmount: lastDividendAmount,
        nextDividend: nextDividend,
        nextDividendAmount: nextDividendAmount,
        name: holding.name,
        realized: realized,
        realizedfy: realizedfy,
        lastPrice: price,
        id: holding._id.toString(),
        currency: holding.currency,
        ticker: holding.ticker,
        type: holdingType,
        risk: holding.risk || 0,
        unrealized: unrealized,
        openQuantity: quantity,
        averageOpenPrice: cost / quantity,
        value: valueMainCurrency,
        today: today,
        cost: costMainCurrency,
        nextEarnings: nextEarnings,
        nextEarningsTime: nextEarningsTime,
        gamma: gammaZone || 0,
        multi: ""
    };
}

async function cryptoHolding(holding: Holding, toDateDT: DateTime): Promise<HoldingReport> {
    const trades = await db.collection('trade').find({ holding: holding._id.toString() }).toArray();
    trades.sort(sortEvent);

    let quantity = 0;
    let cost = 0;
    let averageOpenPrice = 0;
    let today = 0;
    let realized = 0;
    let realizedfy = 0;

    const todayCandle = await getCryptoDayCandle(holding.ticker, toDateDT.toISODate() || "");
    const startOfDay = toDateDT.toUTC().startOf('day');
    const endOfDay = startOfDay.endOf('day');

    const dayChange = todayCandle ? todayCandle.close - todayCandle.open : 0;
    let startOfFinancialYear = toDateDT.minus({ years: 1 }).set({ month: 7, day: 1 }).startOf('day');
    if (startOfDay.month >= 7) startOfFinancialYear = toDateDT.set({ month: 7, day: 1 }).startOf('day');
    const endOfFinancialYear = startOfFinancialYear.plus({ years: 1 }).minus({ days: 1 }).endOf('day');
    let qtyToday = 0;

    for (const trade of trades) {
        const time = DateTime.fromISO(trade.timestamp);
        if (time > toDateDT) {
            break;
        }
        if (trade.type === 'BUY') {
            quantity += trade.quantity - trade.qtyFees;
            cost += (trade.price * trade.quantity) + trade.fees;
            if (time > startOfDay && time < endOfDay && todayCandle) {
                const sinceChange = todayCandle.close - trade.price;
                today += trade.quantity * sinceChange;
                qtyToday += trade.quantity;
            }
        } else {
            if (time > startOfFinancialYear && time < endOfFinancialYear) {
                realizedfy += (trade.price * trade.quantity) - (averageOpenPrice * trade.quantity);
            }
            realized += (trade.price * trade.quantity) - (averageOpenPrice * trade.quantity);
            quantity -= trade.quantity;
            cost -= (averageOpenPrice * trade.quantity);
            if (time > startOfDay) {
                const sinceChange = trade.price - todayCandle.open;
                today += trade.quantity * sinceChange;
            }
        }
        averageOpenPrice = cost / quantity;
    }

    const price = todayCandle ? todayCandle.close : 0;

    const user = await db.collection('users').findOne({
        _id: new ObjectId(holding.owner)
    });
    let currency = "USD";

    if (user) {
        currency = user.currency;
    }

    const exchangeRate = await getExchangeRate("USD" + currency);

    const costMainCurrency = exchangeRate * cost;
    const valueMainCurrency = quantity * price * exchangeRate;

    today += (quantity - qtyToday) * dayChange;
    today = exchangeRate * today;

    const value = quantity * price;

    return {
        name: holding.ticker,
        realized: realized,
        realizedfy: realizedfy,
        lastPrice: price,
        id: holding._id.toString(),
        currency: "USDT",
        ticker: holding.ticker,
        type: holding.type,
        risk: holding.risk || 0,
        unrealized: (quantity * price) - cost,
        openQuantity: quantity,
        averageOpenPrice: cost / quantity,
        value: valueMainCurrency,
        today: today,
        cost: costMainCurrency,
        nextEarnings: "",
        nextEarningsTime: "",
        lastDividend: "",
        lastDividendAmount: 0,
        nextDividend: "",
        nextDividendAmount: 0,
        gamma: 0,
        multi: ""
    }

}

async function optionHolding(option: Option, toDateDT: DateTime): Promise<HoldingReport> {
    const holding = await getHolding(option.holding);
    const trades = await db.collection('optiontrade').find({ option: option._id.toString() }).toArray();
    trades.sort(sortEvent);

    const name = getOptionName(option, holding);

    let quantity = 0;
    let cost = 0;
    let averageOpenPrice = 0;
    let today = 0;
    let realized = 0;
    let realizedfy = 0;

    //if there are no candles at all
    const ticker = await getOptionTicker(option._id);
    const candles = await db.collection('options-1d').find({ ticker: ticker }).toArray();

    if (candles.length == 0) {
        let { qty, avgPrice } = await getOpenOptionSnapshot(option._id);
        if (avgPrice == Infinity) {
            avgPrice = 0;
        }
        return {
            name: name,
            realized: 0,
            realizedfy: 0,
            lastPrice: avgPrice,
            id: holding._id.toString(),
            currency: "USD",
            ticker: name,
            type: "Option",
            risk: 0,
            unrealized: 0,
            openQuantity: qty,
            averageOpenPrice: avgPrice,
            value: avgPrice * qty,
            today: 0,
            cost: avgPrice * qty,
            nextEarnings: "",
            nextEarningsTime: "",
            lastDividend: "",
            lastDividendAmount: 0,
            nextDividend: "",
            nextDividendAmount: 0,
            gamma: 0,
            multi: ""
        }
    }

    let todayCandle = await getOptionDayCandle(option._id, toDateDT.toISODate() || "", false);
    if (!todayCandle) {
        const { qty, avgPrice } = await getOpenOptionSnapshot(option._id);
        todayCandle = {
            open: avgPrice / 100,
            close: avgPrice / 100,
            high: avgPrice / 100,
            low: avgPrice / 100
        }
    }

    const startOfDay = toDateDT.toUTC().startOf('day');
    const endOfDay = startOfDay.endOf('day');
    let startOfFinancialYear = toDateDT.minus({ years: 1 }).set({ month: 7, day: 1 }).startOf('day');
    if (startOfDay.month >= 7) startOfFinancialYear = toDateDT.set({ month: 7, day: 1 }).startOf('day');
    const endOfFinancialYear = startOfFinancialYear.plus({ years: 1 }).minus({ days: 1 }).endOf('day');

    const dayChange = await getOptionDayChange(option._id, toDateDT.toISODate() || "");
    let qtyToday = 0;

    let multi = "";
    for (const trade of trades) {
        const time = DateTime.fromISO(trade.timestamp);
        if (time > toDateDT) {
            break;
        }
        if (trade.multi) {
            multi = trade.multi;
        }
        if (trade.type === 'BUY') {
            quantity += trade.quantity;
            cost += (trade.price * trade.quantity) + (trade.fees / 100);
            if (time > startOfDay && time < endOfDay && todayCandle) {
                const sinceChange = todayCandle.close - trade.price;
                today += trade.quantity * sinceChange * 100;
                qtyToday += trade.quantity;
            }
        } else {
            if (time > startOfFinancialYear && time < endOfFinancialYear) {
                realizedfy += (trade.price * trade.quantity) - (averageOpenPrice * trade.quantity);
            }
            realized += (trade.price * trade.quantity) - (averageOpenPrice * trade.quantity);
            quantity -= trade.quantity;
            if (quantity < 0) {
                cost += (trade.price * trade.quantity) + (trade.fees / 100);
            } else {
                cost -= (averageOpenPrice * trade.quantity);
            }
            if (time > startOfDay && time < endOfDay) {
                const sinceChange = trade.price - todayCandle.open;
                today += trade.quantity * sinceChange;
            }
        }
        if (quantity != 0)
            averageOpenPrice = cost / quantity;
        else
            averageOpenPrice = 0;
    }

    if (quantity < 0) {
        averageOpenPrice = -averageOpenPrice;
    }

    let price = await getOptionPrice(option._id, toDateDT.toISODate() || "");
    if (quantity < 0) price = -price;

    today += (quantity - qtyToday) * dayChange * 100;

    if (!price || price == 0) price = averageOpenPrice;

    let valueMainCurrency = 0;
    let costMainCurrency = 0;
    const value = quantity * Math.abs(price) * 100;
    let unrealized = value - cost * 100;
    if (quantity < 0) unrealized = value + cost * 100;

    const user = await db.collection('users').findOne({
        _id: new ObjectId(holding.owner)
    });
    let currency = "USD";

    if (user) {
        currency = user.currency;
    }

    if (holding.currency != currency) {
        const exchangeRate = await getExchangeRate(holding.currency + currency);
        costMainCurrency = exchangeRate * cost;
        valueMainCurrency = exchangeRate * value;
        today = exchangeRate * today;
        unrealized = exchangeRate * unrealized;
    } else {
        costMainCurrency = cost;
        valueMainCurrency = value;
    }

    const earnings = await db.collection('stocks-earnings').find({ ticker: holding.ticker }).toArray();
    let nextEarnings = "";
    let nextEarningsTime = "";
    let earliest = DateTime.now().plus({ years: 10 }).toMillis();
    const now = DateTime.now();
    for (const earning of earnings) {
        const time = DateTime.fromISO(earning.date);
        const millis = time.toMillis();
        if (time > now && millis < earliest) {
            earliest = millis;
            nextEarnings = time.toISO() || "";
            nextEarningsTime = earning.hour
        }
    }

    const expires = DateTime.fromISO(option.expiry);
    if (expires < toDateDT.minus({ days: 1 }) && quantity > 0) {
        //expired worthless
        today = 0;
        valueMainCurrency = 0;
        unrealized = 0;
        realized = -cost;
    }

    let gammaZone = await getNextExpiryGammaZone(holding.ticker);

    let risk = 4;
    if (option.type == "put") risk = -4;

    return {
        name: name,
        realized: realized * 100,
        realizedfy: realizedfy * 100,
        lastPrice: price * 100,
        id: holding._id.toString(),
        currency: holding.currency,
        ticker: name,
        type: "Option",
        risk: risk,
        unrealized: unrealized,
        openQuantity: quantity,
        averageOpenPrice: 100 * cost / quantity,
        value: valueMainCurrency || 0,
        today: today,
        cost: (costMainCurrency || 0) * 100,
        nextEarnings: nextEarnings,
        nextEarningsTime: nextEarningsTime,
        lastDividend: "",
        lastDividendAmount: 0,
        nextDividend: "",
        nextDividendAmount: 0,
        gamma: gammaZone || 0,
        multi: multi
    };
}