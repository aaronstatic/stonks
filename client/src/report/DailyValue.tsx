import { DailyValueReport } from '@schema/report/daily-value'
import { useEffect, useState } from 'react'
import Server from '../lib/Server'
import ReactApexChart from 'react-apexcharts';
import { Loader } from 'rsuite';
import { DateTime } from 'luxon';
import { formatLargeNumber } from '../util/format';


export default function DailyValue() {
    const [data, setData] = useState<DailyValueReport | null>(null)

    useEffect(() => {
        Server.getReport('daily-value').then(setData)
    }, []);

    if (!data) return <Loader center />

    const history = [];
    for (const day of data.days) {
        history.push({
            x: DateTime.fromISO(day.date).toJSDate(),
            y: day.value
        });
    }
    history.sort((a, b) => a.x.getTime() - b.x.getTime());
    let color = "#4D9A51";
    if (history.length > 0 && history[history.length - 1].y < history[history.length - 2].y) {
        color = "#CE463D";
    }

    let series = [
        {
            name: "Value",
            data: history,
            color: color,
            type: "area"
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
                    type: "area",
                    height: 350
                },
                stroke: {
                    curve: "straight",
                    width: 1
                },
                fill: {
                    opacity: 0.5
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
                            return "$" + formatLargeNumber(value, 1);
                        }
                    }
                }
            }}
            series={series}
            width="350"
            height="200"
        />
    )
}