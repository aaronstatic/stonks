import { DailyProfitLossReport } from '@schema/report/daily-profitloss'
import { useEffect, useState } from 'react'
import Server from '../lib/Server'
import ReactApexChart from 'react-apexcharts';
import { Loader } from 'rsuite';
import { DateTime } from 'luxon';


export default function DailyProfitLoss() {
    const [data, setData] = useState<DailyProfitLossReport | null>(null)

    useEffect(() => {
        Server.getReport('daily-profitloss').then(setData)
    }, []);

    if (!data) return <Loader center />

    const gainHistory = [];
    for (const day of data.days) {
        gainHistory.push({
            x: DateTime.fromISO(day.date).toJSDate(),
            y: day.profitloss,
            fillColor: day.profitloss > 0 ? "#58b15b" : "#f04f43"
        });
    }
    gainHistory.sort((a, b) => a.x.getTime() - b.x.getTime());
    let gainSeries = [
        {
            name: "Gains",
            data: gainHistory,
            color: "#cccccc"
        }
    ];

    return (
        <ReactApexChart
            options={{
                theme: {
                    mode: "dark"
                },
                chart: {
                    toolbar: {
                        show: false
                    },
                    background: "transparent",
                    foreColor: "#666",
                    type: "bar",
                    height: 350
                },
                xaxis: {
                    type: "datetime"
                },
                grid: {
                    borderColor: "#333"
                },
                dataLabels: {
                    enabled: false
                },
                yaxis: {
                    labels: {
                        formatter: (value) => {
                            return "$" + value.toFixed(0);
                        }
                    }
                }
            }}
            series={gainSeries}
            type="bar"
            width="350"
            height="200"
        />
    )
}