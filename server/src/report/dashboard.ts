import { getAllAccounts, getTotalAccountBalance } from "../lib/accounts";
import { getOpenCryptoHoldings } from "../lib/crypto";
import { getOpenStockHoldings, sortEvent } from "../lib/stocks"
import { HoldingReport } from "@schema/report/holding"
import { DashboardReport } from "@schema/report/dashboard"
import { getMultiLegOption, getOpenOptions } from "../lib/options";

import holdingReport from "./holding";
import { getAllHoldings } from "../lib/holdings";
import db from "../lib/mongo";
import { DateTime } from "luxon";
import { ObjectId } from "mongodb";
import MultiLegOption from "@schema/multilegoption";

export const bondStocks = [
    "TLT"
]

export const goldStocks = [
    "GLD"
]

export default async function dashboard(owner: string = "", params: any = {}): Promise<DashboardReport> {
    let toDate = params.toDate || "";

    const openHoldings = await getOpenStockHoldings(owner, toDate);

    let totalValue = 0;
    let totalUnrealized = 0;
    const distribution: { [key: string]: number } = {};
    let risk = 0;
    let dayTotal = 0;

    const holdings: HoldingReport[] = [];

    for (const holding of openHoldings) {
        const report = await holdingReport(owner, { ticker: holding.ticker, type: holding.type, toDate: toDate });
        if (report) {
            totalValue += report.value || 0;
            totalUnrealized += report.unrealized || 0;
            dayTotal += report.today || 0;
            risk += (report.risk || 0) * (report.value || 0);

            let holdingType = "Stock";
            if (bondStocks.includes(holding.ticker)) {
                holdingType = "Bonds";
            } else if (goldStocks.includes(holding.ticker)) {
                holdingType = "Gold";
            }

            if (!distribution[holdingType]) {
                distribution[holdingType] = 0;
            }
            distribution[holdingType] += report.value;
            holdings.push(report);
        } else {
            console.log("No report for holding", holding.ticker);
        }
    }

    const openCrypto = await getOpenCryptoHoldings(owner, toDate);

    for (const holding of openCrypto) {
        const report = await holdingReport(owner, { ticker: holding.ticker, type: holding.type, toDate: toDate });
        if (report && report.value > 1 && report.openQuantity > 0.0002) {
            totalValue += report.value;
            totalUnrealized += report.unrealized;
            dayTotal += report.today;
            risk += report.risk * report.value;
            if (!distribution[holding.type]) {
                distribution[holding.type] = 0;
            }
            distribution[holding.type] += report.value;
            holdings.push(report);
        }
    }

    const openOptions = await getOpenOptions(owner, toDate);

    const multilegs: { [key: string]: MultiLegOption } = {};
    const legs: { [key: string]: HoldingReport[] } = {};

    for (const option of openOptions) {
        const report = await holdingReport(owner, { ticker: option._id.toString(), type: "Option", toDate: toDate });
        if (report) {
            totalValue += report.value;
            totalUnrealized += report.unrealized;
            dayTotal += report.today;
            risk += report.risk * report.value;
            if (!distribution["Options"]) {
                distribution["Options"] = 0;
            }
            distribution["Options"] += report.value;

            if (report.multi) {
                if (!multilegs[report.multi]) {
                    multilegs[report.multi] = await getMultiLegOption(report.multi);
                    legs[report.multi] = [];
                }
                legs[report.multi].push(report);
            } else {
                holdings.push(report);
            }
        }
    }

    for (const multi in multilegs) {
        const multitrades = await db.collection('multilegoptiontrade').find({ multi: multi }).toArray();
        let quantity = 0;
        for (const trade of multitrades) {
            if (trade.type === 'BUY') {
                quantity += trade.quantity;
            } else {
                quantity -= trade.quantity;
            }
        }
        let risk = 3;
        if (multilegs[multi].type.includes("Bear")) {
            risk = -3;
        }
        const report: HoldingReport = {
            ticker: multilegs[multi].name,
            name: multilegs[multi].name,
            type: "Option",
            risk: risk,
            unrealized: 0,
            realized: 0,
            realizedfy: 0,
            openQuantity: quantity,
            averageOpenPrice: 0,
            value: 0,
            today: 0,
            currency: legs[multi][0].currency,
            id: multilegs[multi]._id,
            lastPrice: 0,
            cost: 0,
            nextEarnings: legs[multi][0].nextEarnings,
            nextEarningsTime: legs[multi][0].nextEarningsTime,
            lastDividend: "",
            lastDividendAmount: 0,
            nextDividend: "",
            nextDividendAmount: 0,
            gamma: legs[multi][0].gamma,
            multi: multilegs[multi]._id
        };

        for (const leg of legs[multi]) {
            report.value += leg.value;
            report.unrealized += leg.unrealized;
            report.today += leg.today;
            report.averageOpenPrice += leg.averageOpenPrice;
            report.openQuantity += leg.openQuantity;
            report.cost += leg.cost;
            report.lastPrice += leg.lastPrice;
        }

        holdings.push(report);
    }

    if (!distribution["Cash"]) {
        distribution["Cash"] = 0;
    }

    const user = await db.collection('users').findOne({
        _id: new ObjectId(owner)
    });
    let currency = "USD";

    if (user) {
        currency = user.currency;
    }

    const accounts = await getAllAccounts(owner, toDate);
    const accountBalance = await getTotalAccountBalance(owner, toDate, currency);

    distribution["Cash"] += accountBalance;
    totalValue += accountBalance;

    risk += accountBalance * -3;

    holdings.sort((a, b) => {
        if (a.value < b.value) return 1;
        if (a.value > b.value) return -1;
        return 0;
    });

    accounts.sort((a, b) => {
        if (a.balance < b.balance) return 1;
        if (a.balance > b.balance) return -1;
        return 0;
    });

    let totalRealized = 0;
    const allHoldings = await getAllHoldings(owner);
    for (const holding of allHoldings) {
        //get all trades
        const trades = await db.collection('trade').find({ holding: holding._id.toString() }).toArray();
        trades.sort(sortEvent);
        let averageOpenPrice = 0;
        let cost = 0;
        let quantity = 0;
        let realizedfy = 0;

        if (toDate === "") {
            toDate = DateTime.now().toISO();
        }
        const toDateDT = DateTime.fromISO(toDate);
        let startOfFinancialYear = DateTime.fromObject({ month: 7, day: 1, year: toDateDT.year }).startOf('day');
        if (toDateDT.month < 7) {
            startOfFinancialYear = startOfFinancialYear.minus({ year: 1 });
        }
        const endOfFinancialYear = startOfFinancialYear.plus({ year: 1 });

        for (const trade of trades) {
            const time = DateTime.fromISO(trade.timestamp);
            if (time > toDateDT) {
                break;
            }
            if (trade.type === 'BUY') {
                quantity += trade.quantity;
                cost += (trade.price * trade.quantity) + trade.fees;
            } else {
                if (time > startOfFinancialYear && time < endOfFinancialYear) {
                    realizedfy += (trade.price * trade.quantity) - (averageOpenPrice * trade.quantity);
                }
                quantity -= trade.quantity;
                cost -= (averageOpenPrice * trade.quantity);
            }
            averageOpenPrice = cost / quantity;
        }
        totalRealized += realizedfy;
    }

    return {
        accounts,
        mainCurrency: currency,
        today: dayTotal,
        holdings,
        risk: (risk / totalValue) || 0,
        unrealized: totalUnrealized,
        realizedfy: totalRealized,
        totalValue,
        distribution
    };
}