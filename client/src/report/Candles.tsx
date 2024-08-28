import { useEffect, useState } from "react";
import Server from "../lib/Server";
import { CandleReport } from "@schema/report/candles";
import { Loader } from "rsuite";
import { DateTime } from "luxon";
import { Candle } from "@schema/report/candles";

import HighChartsStock from "highcharts/modules/stock";
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighChartsAccessibility from 'highcharts/modules/accessibility';
import StockTools from 'highcharts/modules/stock-tools';
import DragPanes from "highcharts/modules/drag-panes";
import AnnotationsAdvanced from "highcharts/modules/annotations-advanced";
import PriceIndicator from "highcharts/modules/price-indicator";
import styled from "styled-components";
import Indicators from 'highcharts/indicators/indicators';
import EMA from "highcharts/indicators/ema";
import RSI from "highcharts/indicators/rsi";

Indicators(Highcharts);
RSI(Highcharts);
EMA(Highcharts);
HighChartsStock(Highcharts);
HighChartsAccessibility(Highcharts);
StockTools(Highcharts);
DragPanes(Highcharts);
AnnotationsAdvanced(Highcharts);
PriceIndicator(Highcharts);

interface CandlesProps {
    ticker: string;
    type: string;
    title: string;
    avgOpen: number;
}

const Wrapper = styled.div`

`

interface FairValueGap {
    start: Candle;
    end: Candle;
}

const findMostRecentFairValueGap = (candles: Candle[]): FairValueGap | null => {
    for (let i = candles.length - 2; i >= 0; i--) {
        const current = candles[i];
        const next = candles[i + 1];

        if (current.high < next.low) {
            // Check if the gap has been filled
            for (let j = i + 2; j < candles.length; j++) {
                const subsequentCandle = candles[j];
                if (subsequentCandle.low <= current.high || subsequentCandle.high >= next.low) {
                    return null;
                }
            }
            return { start: current, end: next };
        }
    }

    return null;
};

export default function Candles({ ticker, type, title, avgOpen }: CandlesProps) {
    const [data, setData] = useState<CandleReport | null>(null);

    useEffect(() => {
        Server.getReport('candles', { ticker, type }).then((d) => {
            setData(d);
        });
    }, []);

    if (!data) {
        return <Loader center />
    }

    const series = data.candles.map((candle: Candle) => {
        return [DateTime.fromISO(candle.timestamp).toMillis(), candle.open, candle.high, candle.low, candle.close];
    });

    const volume = data.candles.map((candle: Candle) => {
        return [DateTime.fromISO(candle.timestamp).toMillis(), candle.volume];
    });

    const upColor = '#26A69A';
    const downColor = '#EF5350';
    const lastPrice = series[series.length - 1][4];
    let avgColor = upColor;
    if (lastPrice < avgOpen) {
        avgColor = downColor;
    }

    //const fvg = findMostRecentFairValueGap(data.candles);
    //console.log(fvg);


    return (
        <Wrapper>
            <HighchartsReact
                highcharts={Highcharts}
                constructorType={"stockChart"}
                options={{
                    chart: {
                        height: 600,
                        backgroundColor: '#1a1d24'
                    },
                    title: {
                        text: title,
                        style: {
                            color: '#c5c7c9'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#fbfbfb',
                        borderRadius: 0,
                        borderWidth: 0,
                        padding: 3
                    },
                    xAxis: {
                        gridLineColor: '#ffffff10',
                        gridLineWidth: 1,
                        lineColor: '#8E919B',
                        tickColor: '#8E919B',
                        tickLength: 5,
                        labels: {
                            style: {
                                color: '#8E919B'
                            }
                        }
                    },
                    navigator: {
                        scrollbar: {
                            enabled: false
                        },
                        handles: {
                            width: 8,
                            height: 24,
                            backgroundColor: '#0190b7',
                            lineWidth: 0
                        },
                        maskInside: false,
                        maskFill: '#eeeeee44',
                        xAxis: {
                            gridLineWidth: 0,
                            labels: {
                                style: {
                                    color: '#c5c7c9',
                                    opacity: 1,
                                    textOutline: 0
                                }
                            }
                        },
                        series: {
                            type: 'line',
                            color: '#888',
                        }
                    },
                    yAxis: [{
                        height: '60%',
                        plotLines: [{
                            color: avgColor,
                            width: 1,
                            value: avgOpen
                        }],
                        crosshair: {
                            label: {
                                backgroundColor: '#8E919B',
                                borderRadius: 0,
                                enabled: true,
                                padding: 3,
                                valueDecimals: 2,
                                style: {
                                    color: '#000'
                                }
                            }
                        },
                        gridZIndex: -1,
                        gridLineColor: '#ffffff10',
                        lineColor: '#8E919B',
                        lineWidth: 1,
                        labels: {
                            align: 'left',
                            style: {
                                color: '#8E919B'
                            }
                        }
                    }, {
                        top: '60%',
                        height: '20%',
                        gridLineColor: '#ffffff10',
                        lineColor: '#8E919B',
                        labels: {
                            enabled: false
                        }
                    }, {
                        plotLines: [{
                            value: 80
                        }, {
                            value: 20
                        }],
                        top: '80%',
                        height: '20%',
                        gridLineColor: '#ffffff10',
                        lineColor: '#8E919B',
                        labels: {
                            enabled: false
                        }
                    }],
                    plotOptions: {
                        candlestick: {
                            color: '#EF5350',
                            lineColor: '#EF5350',
                            upColor: '#26A69A',
                            upLineColor: '#26A69A'
                        },
                        series: {
                            marker: {
                                enabled: false
                            },
                            tooltip: {
                                valueDecimals: 2
                            },
                            lineWidth: 1,
                            lastPrice: {
                                color: '#c0c0c000',
                                enabled: true,
                                label: {
                                    backgroundColor: '#8E919B',
                                    borderRadius: 0,
                                    enabled: true,
                                    padding: 3,
                                    style: {
                                        color: '#000'
                                    }
                                }
                            }
                        },
                        rsi: {
                            lastPrice: {
                                enabled: false
                            }
                        },
                        ema: {
                            lastPrice: {
                                enabled: false
                            }
                        },
                        column: {
                            lastPrice: {
                                enabled: false
                            },
                            color: '#555555'
                        }
                    },
                    navigation: {
                        buttonOptions: {
                            theme: {
                                fill: '#333333',
                                'stroke-width': 0
                            }
                        }
                    },
                    rangeSelector: {
                        selected: 1,
                        buttonTheme: {
                            fill: '#333333',
                            padding: 1,
                            r: 2,
                            states: {
                                hover: {
                                    style: {
                                        color: '#333333'
                                    }
                                }
                            },
                            style: {
                                color: '#c5c7c9'
                            }
                        },
                        inputStyle: {
                            color: '#c5c7c9'
                        },
                        labelStyle: {
                            color: '#c5c7c9'
                        }
                    },
                    series: [{
                        name: ticker,
                        id: 'main',
                        type: 'candlestick',
                        data: series,
                        tooltip: {
                            valueDecimals: 2
                        },
                        zIndex: 2
                    }, {
                        type: 'column',
                        name: 'Volume',
                        data: volume,
                        yAxis: 1
                    }, {
                        type: 'ema',
                        linkedTo: 'main',
                        zIndex: 1,
                        params: {
                            period: 20
                        },
                        color: '#2962FF',
                    }, {
                        type: 'ema',
                        linkedTo: 'main',
                        zIndex: 0,
                        params: {
                            period: 50
                        },
                        color: '#4CAF50',
                    }, {
                        type: 'ema',
                        linkedTo: 'main',
                        zIndex: 1,
                        params: {
                            period: 150
                        },
                        color: '#dddddd',
                    }, {
                        type: 'ema',
                        linkedTo: 'main',
                        zIndex: 1,
                        params: {
                            period: 200
                        },
                        color: '#f04f43',
                    }, {
                        type: 'rsi',
                        linkedTo: 'main',
                        yAxis: 1,
                        params: {
                            period: 14
                        },
                        color: '#7753B8',
                    }]
                }}
            />
        </Wrapper>
    );
}