import { DateTime } from "luxon";
import db from "../lib/mongo";

import BaseNode, { Inputs, Outputs } from "../strategy/node/BaseNode";
import ConditionNode from "../strategy/node/Condition";
import ContextNode from "../strategy/node/Context";
import RSINode from "../strategy/node/RSI";
import EMANode from "../strategy/node/EMA";
import NotifyNode from "../strategy/node/Notify";
import BooleanNode from "../strategy/node/Boolean";
import HawkesVolatilityNode from "../strategy/node/HawkesVolatility";
import StochasticRSINode from "../strategy/node/StochasticRSI";
import MathNode from "../strategy/node/MathNode";
import { getOpenStockHoldings } from "../lib/stocks";
import { Candle } from "@schema/report/candles";

const nodes: { [type: string]: typeof BaseNode } = {
    "context": ContextNode,
    "rsi": RSINode,
    "condition": ConditionNode,
    "notify": NotifyNode,
    "ema": EMANode,
    "boolean": BooleanNode,
    "hawkes": HawkesVolatilityNode,
    "stochasticrsi": StochasticRSINode,
    "math": MathNode
}

type Edge = {
    source: string
    target: string
    sourceHandle: string
    targetHandle: string
}

type Node = {
    id: string
    type: string
    data: {
        name: string
        [key: string]: any
    }
}

function topologicalSort(nodes: Node[], edges: Edge[]) {
    const inDegree: { [id: string]: number } = {};
    const graph: { [id: string]: string[] } = {};

    for (const node of nodes) {
        inDegree[node.id] = 0;
        graph[node.id] = [];
    }

    for (const edge of edges) {
        inDegree[edge.target]++;
        graph[edge.source].push(edge.target);
    }

    const queue = nodes.filter(node => inDegree[node.id] === 0);
    const result: Node[] = [];

    while (queue.length > 0) {
        const node = queue.shift() as Node;
        result.push(node);

        for (const neighbor of graph[node.id]) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] === 0) {
                queue.push(nodes.find(n => n.id === neighbor) as Node);
            }
        }
    }

    return result;
}

function processNode(node: Node, inputs: Inputs, context: any): Outputs {
    const NodeClass = nodes[node.type];
    if (!NodeClass) {
        console.warn(`Node type ${node.type} not found`);
        return inputs;
    }
    const instance = new NodeClass();
    for (const key in inputs) {
        const input = instance.inputs.find(i => i.name === key);
        if (input) {
            if (input.type === "number" && Array.isArray(inputs[key])) {
                inputs[key] = inputs[key][inputs[key].length - 1];
            }
        }
    }
    return instance.process(node.data, inputs, context);
}


export default async function updateStrategies(now: DateTime): Promise<boolean> {
    const collection = db.collection("strategy");
    const watchlist = db.collection("watchlist");
    const lastRunCollection = db.collection("strategy-lastrun");
    const strategies = await collection.find().toArray();

    //clear last run
    await lastRunCollection.deleteMany({});

    now = now.setZone("America/New_York");

    for (const strategy of strategies) {
        let applyTo = strategy.applyTo || "All";
        if (!strategy.nodes || !strategy.edges) {
            continue;
        }

        if (applyTo === "All" || applyTo === "Stocks") {
            if (now.weekday > 5) {
                //skip weekends
                if (applyTo === "All") {
                    applyTo = "Crypto";
                } else {
                    continue;
                }
            }
            if (now.hour < 4 || now.hour > 20) {
                //skip off hours
                if (applyTo === "All") {
                    applyTo = "Crypto";
                } else {
                    continue;
                }
            }
        }

        let timeframe = strategy.timeframe || "1d";

        if (timeframe === "1d") {
            //Process at market close
            if (now.hour != 16 || now.minute != 0) continue;
        }
        if (timeframe === "4h") {
            //Process at 4h close
            if (now.hour % 4 != 0 || now.minute != 0) continue;
        }
        if (timeframe === "1h") {
            //Process at 1h close
            if (now.minute != 0) continue;
        }

        const owner = strategy.owner;
        const watchlistItems = await watchlist.find({ owner }).toArray();
        const stocks: string[] = [];
        for (const item of watchlistItems) {
            if (item.type == "Crypto") continue;
            if (!stocks.includes(item.ticker)) {
                stocks.push(item.ticker);
            }
        }

        const openHoldings = await getOpenStockHoldings(owner);
        for (const holding of openHoldings) {
            if (!stocks.includes(holding.ticker)) {
                stocks.push(holding.ticker);
            }
        }

        const nodes = strategy.nodes as Node[];
        const edges = strategy.edges as Edge[];

        const nodeMap: { [id: string]: Node } = {};
        for (const node of nodes) {
            nodeMap[node.id] = node;
        }

        const sortedNodes = topologicalSort(nodes, edges);

        if (applyTo === "All" || applyTo === "Stocks") {
            for (const ticker of stocks) {
                console.log(`Processing strategy ${strategy.name} for ${ticker} on ${timeframe} timeframe`);
                let limit = 300;
                const candles = await db.collection(`stocks-${timeframe}`).find({ ticker: ticker }).sort({ timestamp: -1 }).limit(limit).toArray();
                candles.reverse();

                await runStrategy(now, strategy.name, ticker, sortedNodes, edges, candles, strategy.owner.toString());
            }
        }
        if (applyTo === "All" || applyTo === "Crypto") {
            const cryptos: string[] = [];
            for (const item of watchlistItems) {
                if (item.type != "Crypto") continue;
                if (!cryptos.includes(item.ticker)) {
                    cryptos.push(item.ticker);
                }
            }
            for (const crypto of cryptos) {
                console.log(`Processing strategy ${strategy.name} for ${crypto} on ${timeframe} timeframe`);
                let limit = 300;
                const candles = await db.collection(`crypto-${timeframe}`).find({ ticker: crypto }).sort({ timestamp: -1 }).limit(limit).toArray();
                candles.reverse();

                await runStrategy(now, strategy.name, crypto, sortedNodes, edges, candles, strategy.owner.toString());
            }
        }

    }

    return true;
}

async function runStrategy(now: DateTime, name: string, ticker: string, sortedNodes: Node[], edges: Edge[], candles: any[], owner: string) {
    const lastRunCollection = db.collection("strategy-lastrun");
    const lastCandle = candles[candles.length - 1];

    let context: { [key: string]: any } = {
        Ticker: ticker,
        Candles: candles,
        Open: lastCandle.open,
        Close: lastCandle.close,
        High: lastCandle.high,
        Low: lastCandle.low,
        Volume: lastCandle.volume,
        User: owner
    };

    const nodeOutputs: Record<string, any> = {};
    const nodeInputs: Record<string, any> = {};

    for (const node of sortedNodes) {
        const inputs: { [key: string]: any } = {};

        for (const edge of edges) {
            if (edge.target === node.id) {
                const sourceOutput = nodeOutputs[edge.source];
                if (!sourceOutput) {
                    continue;
                }
                if (sourceOutput[edge.sourceHandle] === undefined) {
                    continue;
                }
                inputs[edge.targetHandle] = sourceOutput[edge.sourceHandle];
            }
        }
        nodeInputs[node.id] = inputs;
        const output = processNode(node, inputs, context);
        nodeOutputs[node.id] = output;
    }

    const lastRun = {
        strategy: name,
        ticker,
        timestamp: now.toJSDate(),
        inputs: nodeInputs,
        outputs: nodeOutputs,
        nodes: sortedNodes
    };

    await lastRunCollection.insertOne(lastRun);
}