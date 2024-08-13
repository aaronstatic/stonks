import { GammaReport } from '@schema/report/gamma';
import { useEffect, useState } from 'react';
import Server from '../lib/Server';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { InputPicker, Loader } from 'rsuite';
import { DateTime } from 'luxon';
import { Stat, StatLabel, Stats, StatValue } from './component/Stats';

export default function DailyProfitLoss({ ticker }: { ticker: string }) {
    const [data, setData] = useState<GammaReport[]>([]);
    const [reportIndex, setReportIndex] = useState<number | null>(null);

    useEffect(() => {
        Server.getReport('gamma', { ticker }).then(setData);
    }, [ticker]);

    if (data.length === 0) return <Loader center />;

    const expiries = data.map((report, i) => ({
        date: report.date,
        label: DateTime.fromISO(report.date).toUTC().toFormat('LLL dd, yyyy'),
        value: i
    }));

    expiries.sort((a, b) => a.date.localeCompare(b.date));

    if (reportIndex === null) {
        setReportIndex(expiries[0].value);
    }


    const report = data[reportIndex || 0];
    const callGEX: number[] = [];
    const putGEX: number[] = [];
    const labels: number[] = [];
    const gexProfile: number[] = [];
    const date = DateTime.fromISO(report.date).toUTC().toFormat('LLL dd, yyyy');

    for (const data of report.data) {
        callGEX.push(data.callGEX);
        putGEX.push(-data.putGEX);
        gexProfile.push(data.gexProfile / 10);
        labels.push(data.strike);
    }

    //find closest label index to spot price
    const spotPrice = report.levels.spotPrice;
    const spotStrike = labels.reduce((prev, curr) => Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev);
    const spotIndex = labels.indexOf(spotStrike);
    const diff = spotPrice - spotStrike;
    let delta = 0;
    if (diff < 0) {
        delta = diff / (labels[spotIndex] - labels[spotIndex - 1])
    } else if (diff > 0) {
        delta = diff / (labels[spotIndex + 1] - labels[spotIndex])
    }

    const options: Highcharts.Options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
        },
        title: {
            text: `Net GEX for ${ticker} ${date}`,
            align: 'center',
            style: { color: '#666' }
        },
        xAxis: {
            plotLines: [
                {
                    color: '#f04f43',
                    width: 1,
                    value: labels.indexOf(report.levels.putSupport),
                    dashStyle: 'Dash'
                },
                {
                    color: '#58b15b',
                    width: 1,
                    value: labels.indexOf(report.levels.callResistance),
                    dashStyle: 'Dash'
                },
                {
                    color: '#666',
                    width: 1,
                    value: labels.indexOf(report.levels.gammaFlip),
                    dashStyle: 'Dash'
                },
                {
                    color: '#fff',
                    width: 1,
                    value: labels.indexOf(spotStrike) + delta,
                    dashStyle: 'Dash'
                },
            ],
            plotBands: [
                {
                    color: '#f04f4320',
                    from: 0,
                    to: labels.indexOf(report.levels.gammaFlip),
                    label: {
                        text: 'Negative Gamma',
                        style: {
                            color: '#f04f43'
                        }
                    }
                },
                {
                    color: '#58b15b20',
                    from: labels.indexOf(report.levels.gammaFlip),
                    to: labels.length - 1,
                    label: {
                        text: 'Positive Gamma',
                        style: {
                            color: '#58b15b'
                        }
                    }
                }
            ],
            categories: labels.map(String),
            title: {
                text: 'Strike Price'
            },
            labels: {
                style: {
                    color: '#8E919B',
                }
            }
        },
        yAxis: [
            {
                title: {
                    text: 'GEX',
                },
                crosshair: {
                    label: {
                        backgroundColor: '#8E919B',
                        borderRadius: 0,
                        enabled: true,
                        padding: 3,
                        style: {
                            color: '#000'
                        }
                    }
                },
                gridZIndex: -1,
                gridLineColor: '#ffffff10',
                lineColor: '#ffffff10',
                lineWidth: 1,
                labels: {
                    enabled: false
                }
            },
        ],
        series: [
            {
                name: 'Call GEX',
                type: 'column',
                data: callGEX,
                color: '#58b15b',
            },
            {
                name: 'Put GEX',
                type: 'column',
                data: putGEX,
                color: '#f04f43',
            },
            {
                name: 'GEX Profile',
                type: 'line',
                data: gexProfile,
                color: '#ff06',
                zIndex: 1,
                marker: {
                    enabled: false
                }
            }
        ],
        plotOptions: {
            column: {
                pointPadding: 0.01,
                borderWidth: 0,
                borderRadius: 0
            },
            series: {
                stacking: 'normal',
            },
        },
        credits: {
            enabled: false,
        },
        legend: {
            itemStyle: {
                color: '#666',
            },
        },
        tooltip: {
            shared: true,
        },
    };

    return (
        <>
            <InputPicker
                data={expiries}
                value={reportIndex}
                onChange={setReportIndex}
                style={{ marginBottom: 10 }}
            />
            <Stats>
                <Stat>
                    <StatLabel>Spot Price</StatLabel>
                    <StatValue>{report.levels.spotPrice}</StatValue>
                </Stat>
                <Stat>
                    <StatLabel>Gamma Flip</StatLabel>
                    <StatValue>{report.levels.gammaFlip}</StatValue>
                </Stat>
                <Stat>
                    <StatLabel>Put Support</StatLabel>
                    <StatValue>{report.levels.putSupport}</StatValue>
                </Stat>
                <Stat>
                    <StatLabel>Call Resistance</StatLabel>
                    <StatValue>{report.levels.callResistance}</StatValue>
                </Stat>
            </Stats>
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ style: { height: '500px' } }}
            />
        </>
    );
}
