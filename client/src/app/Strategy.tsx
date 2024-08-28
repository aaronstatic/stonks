import React, { ComponentType } from 'react';

import RSINode from '../component/strategy/node/RSI';
import ContextNode from '../component/strategy/node/Context';
import ConditionNode from '../component/strategy/node/Condition';
import NotifyNode from '../component/strategy/node/Notify';

import { BaseNode, StrategyNodeProps } from '../component/strategy/node/BaseNode';

import {
    ReactFlow,
    ReactFlowProvider,
    Edge,
    Node,
    NodeTypes,
    DefaultEdgeOptions,
    NodeProps,
    NodeChange,
    applyNodeChanges,
    applyEdgeChanges,
    EdgeChange,
    Background,
    BackgroundVariant,
    Connection,
    addEdge
} from '@xyflow/react';

import styled from 'styled-components';
import { Button, InputPicker, Loader } from 'rsuite';
import Server from '../lib/Server';
import { ItemData } from '../App';
import Toolbar from '../component/desktop/Toolbar';
import StochasticRSINode from '../component/strategy/node/StochasticRSI';
import EMANode from '../component/strategy/node/EMA';
import BooleanNode from '../component/strategy/node/Boolean';
import HawkesVolatilityNode from '../component/strategy/node/HawkesVolatility';
import MathNode from '../component/strategy/node/Math';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    .react-flow__attribution {
        display: none;
    }
`

const Flow = styled.div`
    flex: 1;
    min-height: 0;
    .react-flow__handle.candles {
        border-color: var(--rs-green-600);
        background-color: var(--rs-green-600);
    }
    .react-flow__handle.number, .react-flow__handle.numberstream {
        border-color: var(--rs-orange-600);
        background-color: var(--rs-orange-600);
    }
    .react-flow__handle.trigger {
        border-color: var(--rs-blue-600);
        background-color: var(--rs-blue-600);
    }
`

const AddNodePopup = styled.div`
    position: absolute;
    background-color: var(--rs-gray-800);
    border: 1px solid var(--rs-gray-700);
    border-radius: 2px;
    padding: 10px;
    z-index: 1000;
    box-shadow: 0 0 5px var(--rs-gray-900);
    width: 200px;
`

const AddNodeOption = styled.div`
    padding: 5px;
    cursor: pointer;
    &:hover {
        background-color: var(--rs-gray-700);
    }
`

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const nodeDefaults: { [key: string]: any } = {
    dragHandle: ".header"
}

const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: true,
};

type StrategyState = {
    nodes: Node[],
    edges: Edge[],
    loading: boolean,
    showAddNode: boolean,
    addNodePosition: { x: number, y: number },
    viewport: { x: number, y: number, zoom: number }
    timeframe: string,
    applyTo: string
};

type NodeType = ComponentType<NodeProps & {
    data: any;
    type: any;
}>

type NodeDef = {
    type: string,
    Component: ComponentType<StrategyNodeProps>
}

const nodeTypes: NodeDef[] = [{
    type: 'context',
    Component: ContextNode
}, {
    type: 'rsi',
    Component: RSINode
}, {
    type: 'stochasticrsi',
    Component: StochasticRSINode
}, {
    type: 'ema',
    Component: EMANode
}, {
    type: 'hawkes',
    Component: HawkesVolatilityNode
}, {
    type: 'condition',
    Component: ConditionNode
}, {
    type: 'math',
    Component: MathNode
}, {
    type: 'notify',
    Component: NotifyNode
}, {
    type: 'boolean',
    Component: BooleanNode
}];

export default class Strategy extends React.Component<any, StrategyState> {
    private nodeTypes: NodeTypes;
    private nodeDefs: { [key: string]: NodeDef };

    declare context: React.ContextType<typeof ItemData>

    constructor(props: any) {
        super(props);

        Strategy.contextType = ItemData;

        this.state = {
            loading: true,
            nodes: initialNodes,
            edges: initialEdges,
            timeframe: '1d',
            applyTo: 'All',
            showAddNode: false,
            addNodePosition: { x: 0, y: 0 },
            viewport: { x: 0, y: 0, zoom: 1 }
        };

        const types: NodeTypes = {};
        const nodeDefs: { [key: string]: NodeDef } = {};
        for (const nodeDef of nodeTypes) {
            const { type, Component } = nodeDef;
            types[type] = this.getNodeType(Component);
            nodeDefs[type] = nodeDef;
        }

        this.nodeTypes = types;
        this.nodeDefs = nodeDefs;
    }

    componentDidMount() {
        this.load();
    }

    getNodeType(Node: ComponentType<StrategyNodeProps>): NodeType {
        return (props) => {
            const { data } = props;
            return <Node id={props.id} selected={props.selected || false} data={data} onChangeData={this.onChangeData} />;
        };
    }

    render() {
        if (this.state.loading) {
            return <Loader center size="lg" />
        }
        return (
            <Wrapper>
                <Toolbar>
                    <Button size="xs" onClick={this.save}>Save</Button>
                    <InputPicker
                        name="timeframe"
                        cleanable={false}
                        data={[
                            { label: '15m', value: '15m' },
                            { label: '4h', value: '4h' },
                            { label: '1d', value: '1d' }
                        ]}
                        value={this.state.timeframe}
                        onChange={v => this.setState({ timeframe: v })}
                    />
                    <InputPicker
                        name="applyTo"
                        cleanable={false}
                        data={[
                            { label: 'Stocks', value: 'Stocks' },
                            { label: 'Crypto', value: 'Crypto' },
                            { label: 'All', value: 'All' }
                        ]}
                        value={this.state.applyTo}
                        onChange={v => this.setState({ applyTo: v })}
                    />
                </Toolbar>
                <Flow>
                    <ReactFlowProvider>
                        <ReactFlow
                            panOnDrag={[1]}
                            selectionOnDrag={true}
                            viewport={this.state.viewport}
                            nodes={this.state.nodes}
                            edges={this.state.edges}
                            nodeTypes={this.nodeTypes}
                            defaultEdgeOptions={defaultEdgeOptions}
                            onNodesChange={this.onNodesChange}
                            onEdgesChange={this.onEdgesChange}
                            onConnect={this.onConnect}
                            isValidConnection={this.isValidConnection}
                            onPaneContextMenu={this.onPaneContextMenu}
                            onPaneClick={() => this.setState({ showAddNode: false })}
                            onMove={(_e, data) => {
                                this.setState({
                                    viewport: data
                                });
                            }}
                        >
                            <Background color="#444" variant={BackgroundVariant.Dots} />
                        </ReactFlow>
                    </ReactFlowProvider>
                </Flow>
                {this.state.showAddNode && (
                    <AddNodePopup style={{ left: this.state.addNodePosition.x, top: this.state.addNodePosition.y }}>
                        {nodeTypes.map((nodeType) => {
                            const key = nodeType.type;
                            return <AddNodeOption
                                key={key}
                                onClick={() => {
                                    this.addNode(nodeType);
                                }}>
                                {nodeType.Component.displayName || nodeType.type}
                            </AddNodeOption>
                        })}
                    </AddNodePopup>
                )}
            </Wrapper>
        )
    }

    isValidConnection = (connection: Connection | Edge) => {
        //only 1 connection allowed to a target
        if (this.state.edges.find(e => e.target === connection.target && e.targetHandle === connection.targetHandle)) {
            return false;
        }

        const sourceNode = this.state.nodes.find(n => n.id === connection.source);
        const targetNode = this.state.nodes.find(n => n.id === connection.target);

        if (!sourceNode || !targetNode) {
            return false;
        }

        if (!sourceNode.type || !targetNode.type) {
            return false;
        }

        const sourceType = this.nodeDefs[sourceNode.type];
        const targetType = this.nodeDefs[targetNode.type];

        if (!sourceType || !targetType) {
            return false;
        }

        const sourceNodeComponent = sourceType.Component as any;
        const targetNodeComponent = targetType.Component as any;

        const sourceHandle = sourceNodeComponent.outputs.find((h: { name: string }) => h.name === connection.sourceHandle);
        let targetHandle = targetNodeComponent.inputs.find((h: { name: string }) => h.name === connection.targetHandle);
        if (!targetHandle) {
            targetHandle = targetNodeComponent.formInputs.find((h: { name: string }) => h.name === connection.targetHandle);
        }

        if (!sourceHandle || !targetHandle) {
            return false;
        }

        if (sourceHandle.type === 'numberstream' && targetHandle.type == 'number') {
            return true;
        }

        if (sourceHandle.type !== targetHandle.type) {
            return false;
        }

        return true;
    }

    addNode = (type: NodeDef) => {
        const newId = crypto.randomUUID();
        const newNode = {
            ...nodeDefaults,
            id: newId,
            type: type.type,
            position: {
                x: this.state.addNodePosition.x,
                y: this.state.addNodePosition.y
            },
            data: {
                name: type.Component.displayName || type.type
            }
        };

        this.setState({
            nodes: [...this.state.nodes, newNode],
            showAddNode: false
        });
    }

    onNodesChange = (changes: NodeChange[]) => {
        this.setState({
            nodes: applyNodeChanges(changes, this.state.nodes)
        });
    }

    onEdgesChange = (changes: EdgeChange[]) => {
        this.setState({
            edges: applyEdgeChanges(changes, this.state.edges)
        });
    }

    onConnect = (connection: Connection) => {
        this.setState({
            edges: addEdge({
                id: crypto.randomUUID(),
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle
            }, this.state.edges)
        });
    }

    onChangeData = (nodeId: string, name: string, value: any) => {
        if (name === 'remove') {
            this.setState({
                nodes: [...this.state.nodes.filter(n => n.id !== nodeId)]
            });
            return;
        }

        const node = this.state.nodes.find(n => n.id === nodeId);
        if (!node) {
            return;
        }
        this.setState({
            nodes: [...this.state.nodes.map(n => {
                if (n.id === nodeId) {
                    n.data[name] = value;
                    return {
                        ...n
                    };
                }
                return n;
            })]
        });
    }

    onPaneContextMenu = (event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
        event.preventDefault();
        const parentBox = (event.target as HTMLElement).getBoundingClientRect();

        this.setState({
            showAddNode: true,
            addNodePosition: {
                x: event.clientX - parentBox.left,
                y: event.clientY - parentBox.top + 32
            }
        });
    }

    load = () => {
        if (!this.context) return;

        Server.get('strategy', this.context.id).then((data) => {
            if (!data.nodes || !data.edges) {
                this.setState({
                    loading: false
                });
                return;
            }
            const nodes = data.nodes.map((node: any) => {
                return {
                    ...nodeDefaults,
                    ...node
                };
            });
            this.setState({
                nodes: nodes,
                edges: data.edges,
                loading: false,
                viewport: data.viewport,
                timeframe: data.timeframe || "1d",
                applyTo: data.applyTo || "All"
            });
        });
    }

    save = () => {
        if (!this.context) return;

        const nodes = this.state.nodes.map(node => {
            return {
                id: node.id,
                type: node.type,
                data: node.data,
                position: node.position
            };
        });

        const data = {
            nodes: nodes,
            edges: this.state.edges,
            viewport: this.state.viewport,
            timeframe: this.state.timeframe,
            applyTo: this.state.applyTo
        };

        Server.update('strategy', this.context.id, data).then(() => {

        });
    }
}