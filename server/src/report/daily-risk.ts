import { DailyRisk, DailyRiskReport } from '@schema/report/daily-risk';

import db from '../lib/mongo';
import { DateTime } from 'luxon';

export default async function dailyRisk(owner: string = '', params: any = {}): Promise<DailyRiskReport> {
    const days: DailyRisk[] = [];
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
            risk: day.report.risk
        });
    }

    return {
        days
    };
}
