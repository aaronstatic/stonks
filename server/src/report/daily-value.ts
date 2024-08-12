import { DailyValueReport, DailyValue } from '@schema/report/daily-value';

import db from '../lib/mongo';
import { DateTime } from 'luxon';

export default async function dailyValue(owner: string = '', params: any = {}): Promise<DailyValueReport> {
    const days: DailyValue[] = [];
    const collection = db.collection('history');

    const history = await collection.find({ owner: owner }).toArray();

    const start = DateTime.now().startOf("day").plus({ days: 1 }).minus({ days: 60 });

    for (const day of history) {
        const date = DateTime.fromISO(day.date);
        if (date < start) {
            continue;
        }

        days.push({
            date: day.date,
            value: day.report.totalValue
        });
    }

    return {
        days
    };
}
