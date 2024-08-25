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
import trendingSymbols from "yahoo-finance2/dist/esm/src/modules/insights";
import StochasticRSINode from "../strategy/node/StochasticRSI";

const nodes: { [type: string]: typeof BaseNode } = {
    "context": ContextNode,
    "rsi": RSINode,
    "condition": ConditionNode,
    "notify": NotifyNode,
    "ema": EMANode,
    "boolean": BooleanNode,
    "hawkes": HawkesVolatilityNode,
    "stochasticrsi": StochasticRSINode
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
    if (now.weekday > 5) {
        //skip weekends
        return true;
    }
    if (now.hour < 4 || now.hour > 20) {
        //skip off hours
        return true;
    }

    for (const strategy of strategies) {
        if (!strategy.nodes || !strategy.edges) {
            continue;
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
        const stocks = watchlistItems.map(item => item.ticker);

        const nodes = strategy.nodes as Node[];
        const edges = strategy.edges as Edge[];

        const nodeMap: { [id: string]: Node } = {};
        for (const node of nodes) {
            nodeMap[node.id] = node;
        }

        const sortedNodes = topologicalSort(nodes, edges);

        for (const ticker of stocks) {
            console.log(`Processing strategy ${strategy.name} for ${ticker} on ${timeframe} timeframe`);
            let limit = 300;
            const candles = await db.collection(`stocks-${timeframe}`).find({ ticker: ticker }).sort({ timestamp: -1 }).limit(limit).toArray();
            candles.reverse();
            const lastCandle = candles[candles.length - 1];

            let context: { [key: string]: any } = {
                ticker,
                Candles: candles,
                Open: lastCandle.open,
                Close: lastCandle.close,
                High: lastCandle.high,
                Low: lastCandle.low,
                Volume: lastCandle.volume
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
                strategy: strategy.name,
                ticker,
                timestamp: now.toJSDate(),
                inputs: nodeInputs,
                outputs: nodeOutputs,
                nodes: sortedNodes
            };

            await lastRunCollection.insertOne(lastRun);
        }

    }

    return true;
}