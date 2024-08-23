import db from "../lib/mongo";

import BaseNode, { Inputs, Outputs } from "../strategy/node/BaseNode";
import ConditionNode from "../strategy/node/Condition";
import ContextNode from "../strategy/node/Context";
import RSINode from "../strategy/node/RSI";

const nodes: { [type: string]: typeof BaseNode } = {
    "context": ContextNode,
    "rsi": RSINode,
    "condition": ConditionNode,
    "notify": BaseNode
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


export default async function updateStrategies(): Promise<boolean> {
    const collection = db.collection("strategy");
    const watchlist = db.collection("watchlist");
    const strategies = await collection.find().toArray();

    for (const strategy of strategies) {
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
            console.log(`Processing strategy ${strategy.name} for ${ticker}`);
            const candles = await db.collection('stocks-15m').find({ ticker: ticker }).toArray();
            let context: { [key: string]: any } = {
                ticker,
                Candles: candles
            };

            const nodeOutputs: Record<string, any> = {};

            for (const node of sortedNodes) {
                const inputs: { [key: string]: any } = {};

                for (const edge of edges) {
                    if (edge.target === node.id) {
                        const sourceOutput = nodeOutputs[edge.source];
                        if (!sourceOutput) {
                            continue;
                        }
                        if (!sourceOutput[edge.sourceHandle]) {
                            continue;
                        }

                        inputs[edge.targetHandle] = sourceOutput[edge.sourceHandle];
                    }
                }

                const output = processNode(node, inputs, context);
                nodeOutputs[node.id] = output;
            }
        }

    }

    return true;
}