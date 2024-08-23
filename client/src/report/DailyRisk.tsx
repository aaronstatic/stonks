import { DailyRiskReport } from '@schema/report/daily-risk'
import { useEffect, useState } from 'react'
import Server from '../lib/Server'
import ReactApexChart from 'react-apexcharts';
import { Loader } from 'rsuite';
import { DateTime } from 'luxon';


export default function DailyRisk() {
    const [data, setData] = useState<DailyRiskReport | null>(null)

    useEffect(() => {
        Server.getReport('daily-risk').then(setData)
    }, []);

    if (!data) return <Loader center />

    const gainHistory = [];
    let minValue = 0;
    let maxValue = 0;
    for (const day of data.days) {
        if (day.risk < minValue) {
            minValue = day.risk;
        }
        if (day.risk > maxValue) {
            maxValue = day.risk;
        }

        gainHistory.push({
            x: DateTime.fromISO(day.date).toJSDate(),
            y: day.risk
        });
    }
    gainHistory.sort((a, b) => a.x.getTime() - b.x.getTime());
    let gainSeries = [
        {
            name: "Risk",
            data: gainHistory,
            color: "#cccccc"
        }
    ];
    const zeroPercent = 100 - (100 * (minValue / (minValue - maxValue)));

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
                    type: "area",
                    height: 350
                },
                stroke: {
                    width: 1,
                    colors: ["#888"]
                },
                fill: {
                    opacity: 0.5,
                    type: "gradient",
                    gradient: {
                        type: 'vertical',
                        colorStops: [
                            {
                                offset: 0,
                                color: 'rgb(240, 79, 67)',
                                opacity: 1
                            },
                            {
                                offset: zeroPercent,
                                color: "rgb(240, 79, 67)",
                                opacity: 0.3
                            },
                            {
                                offset: zeroPercent,
                                color: 'rgb(88, 177, 91);',
                                opacity: 0.3
                            },
                            {
                                offset: 100,
                                color: 'rgb(88, 177, 91);',
                                opacity: 1
                            }
                        ]
                    }
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
                            return value.toFixed(2);
                        }
                    }
                }
            }}
            series={gainSeries}
            type="area"
            width="350"
            height="200"
        />
    )
}