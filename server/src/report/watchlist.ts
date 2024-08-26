import { WatchlistReportItem } from '@schema/report/watchlist';

import db from '../lib/mongo';
import { DateTime } from 'luxon';
import { getLatestStockCandle, getNextExpiryGammaZone, getStockDayChangeCandle, getStockPrice } from '../lib/stocks';
import { calculateDCF, findImpliedRate } from '../lib/dcf';
import { getCryptoDayCandle, getCryptoPrice } from '../lib/crypto';

export default async function watchlist(owner: string = '', params: any = {}): Promise<WatchlistReportItem[]> {
    const watchlist: WatchlistReportItem[] = [];
    const collection = db.collection('watchlist');

    const docs = await collection.find({ owner: owner }).toArray();


    for (const doc of docs) {
        const type = doc.type || "Stock";
        if (type === "Stock") {
            let candle = await getLatestStockCandle(doc.ticker);
            if (!candle) {
                candle = {
                    open: 0,
                    close: 0
                }
            }
            const tickerDetails = await db.collection('stocks-detail').findOne({ ticker: doc.ticker });
            let currency = "USD";
            if (tickerDetails) {
                currency = tickerDetails.currency_name.toUpperCase();
            }
            let name = doc.ticker;
            let intrinsicValue = 0;
            let impliedGrowthRate = 0;
            if (tickerDetails) {
                name = tickerDetails.name;
                const financials = await db.collection('stocks-financials').findOne({ ticker: doc.ticker });

                const discountRate = 0.15;
                const growthRate = 0.05;
                const period = 10;

                if (tickerDetails.share_class_shares_outstanding) {
                    if (financials && financials.financials && financials.financials.cash_flow_statement && financials.financials.cash_flow_statement.net_cash_flow_from_operating_activities) {
                        const netCashFlow = financials.financials.cash_flow_statement.net_cash_flow_from_operating_activities.value;
                        intrinsicValue = calculateDCF(netCashFlow, discountRate, growthRate, period) / tickerDetails.share_class_shares_outstanding;
                    }
                }
            }

            const earnings = await db.collection('stocks-earnings').find({ ticker: doc.ticker }).toArray();
            let nextEarnings = "";
            let nextEarningsTime = "";
            const now = DateTime.now();
            if (earnings.length > 0) {
                let earliestEarnings = now.plus({ years: 10 });
                for (const earning of earnings) {
                    const date = DateTime.fromISO(earning.date);
                    if (date && date > now && date < earliestEarnings) {
                        earliestEarnings = date as DateTime<true>;
                        nextEarningsTime = earning.hour;
                    }
                }
                nextEarnings = earliestEarnings.toISODate();
            }

            const gamma = await getNextExpiryGammaZone(doc.ticker);

            watchlist.push({
                _id: doc._id.toString(),
                nextEarnings: nextEarnings,
                nextEarningsTime: nextEarningsTime,
                ticker: doc.ticker,
                lastPrice: candle.close,
                change: candle.close - candle.open,
                changePercent: (candle.close - candle.open) / candle.open * 100,
                currency: currency,
                name: name,
                intrinsicValue: intrinsicValue,
                gamma: gamma,
                type: type
            });
        } else if (type == "Crypto") {
            const candle = await getCryptoDayCandle(doc.ticker);
            watchlist.push({
                _id: doc._id.toString(),
                nextEarnings: "",
                nextEarningsTime: "",
                ticker: doc.ticker,
                lastPrice: candle.close,
                change: candle.close - candle.open,
                changePercent: (candle.close - candle.open) / candle.open * 100,
                currency: "USDT",
                name: doc.ticker,
                intrinsicValue: 0,
                gamma: 0,
                type: type
            });
        }
    }

    return watchlist;
}
