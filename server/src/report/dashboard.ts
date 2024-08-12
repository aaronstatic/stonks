import { getAllAccounts, getTotalAccountBalance } from "../lib/accounts";
import { getOpenCryptoHoldings } from "../lib/crypto";
import { getOpenStockHoldings, sortEvent } from "../lib/stocks"
import { HoldingReport } from "@schema/report/holding"
import { DashboardReport } from "@schema/report/dashboard"
import { getOpenOptions } from "../lib/options";

import holdingReport from "./holding";
import { getAllHoldings } from "../lib/holdings";
import db from "../lib/mongo";
import { DateTime } from "luxon";

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
            risk += report.risk || 0 * report.value || 0;

            let holdingType = "Stock";
            if (holding.risk == 0) holdingType = "Cash";
            if (holding.risk == 1) holdingType = "Bonds";
            if (holding.ticker == "GLD") holdingType = "Gold";

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

    for (const option of openOptions) {
        const report = await holdingReport(owner, { ticker: option.name, type: "Option", toDate: toDate });
        if (report) {
            totalValue += report.value;
            totalUnrealized += report.unrealized;
            dayTotal += report.today;
            risk += report.risk * report.value;
            if (!distribution["Options"]) {
                distribution["Options"] = 0;
            }
            distribution["Options"] += report.value;
            holdings.push(report);
        }
    }

    if (!distribution["Cash"]) {
        distribution["Cash"] = 0;
    }

    const accounts = await getAllAccounts(owner, toDate);
    const accountBalance = await getTotalAccountBalance(owner, toDate);

    distribution["Cash"] += accountBalance;
    totalValue += accountBalance;

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
        mainCurrency: process.env.MAIN_CURRENCY || "USD",
        today: dayTotal,
        holdings,
        risk: risk / totalValue,
        unrealized: totalUnrealized,
        realizedfy: totalRealized,
        totalValue,
        distribution
    };
}