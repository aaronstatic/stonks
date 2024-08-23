import { Handle, Position } from '@xyflow/react';
import React from 'react';
import { Form } from 'rsuite';
import styled from 'styled-components';
import Icon from '../../Icon';

const Wrapper = styled.div`
    background-color: var(--rs-gray-700);
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    font-size: 12px;
    width: 200px;
    border: 1px solid var(--rs-gray-600);
    &.selected {
        border: 1px solid var(--rs-primary-600);
    }
`

const Header = styled.div`
    padding: 4px;
    background-color: var(--rs-gray-900);
    display: flex;
    flex-direction: row;
    &:hover .icon {
        color: var(--rs-gray-300);
    }
    cursor: hand;
`

const NodeName = styled.div`
    flex: 1;
    color: var(--rs-gray-300);
`

const RemoveButton = styled.div`
    cursor: pointer;
    height: 17px;        
    .icon {
        font-size: 17px;
        animate: color 0.2s;
        color: transparent;
        &:hover {
            color: var(--rs-gray-100);
        }
    }

`

const Content = styled.div`
    &.rs-form-vertical {
        .rs-form-group {
            & > * {
                width: 100%;
            }
        }
    }
    cursor: default;
`

const FormWrapper = styled(Form)`
    padding: 10px;
`

const HandleWrapper = styled.div`
    margin: 5px 0;
    position: relative;
    .react-flow__handle-left {
        left: 0px;
        top: 8px;
    }
`

const InputLabel = styled.div`
    font-size: 12px;
    color: var(--rs-gray-300);
    margin-left: 8px;
`

const OutputLabel = styled.div`
    font-size: 12px;
    color: var(--rs-gray-300);
    margin-right: 10px;
    text-align: right;
`

export type NodeData = {
    name: string
}

export type StrategyNodeProps = {
    id: string
    data: NodeData
    onChangeData: (nodeId: string, name: string, value: any) => void
    selected: boolean
}

type InputOutput = {
    name: string
    type: string
}

export class BaseNode<Type extends NodeData> extends React.Component<StrategyNodeProps> {
    static displayName = "BaseNode"

    inputs: InputOutput[] = []
    outputs: InputOutput[] = []
    defaultValues: Type = {} as Type

    getData(): Type {
        return this.props.data as Type
    }

    render() {
        const data = this.props.data as Type;
        for (const key in this.defaultValues) {
            if (data[key] === undefined) {
                data[key] = this.defaultValues[key];
            }
        }

        return <Wrapper className={this.props.selected ? "selected" : ""}>
            <Header className="header">
                <NodeName>{data.name}</NodeName>
                {this.props.selected && (
                    <RemoveButton onClick={() => this.props.onChangeData(this.props.id, 'remove', true)}>
                        <Icon name="remove_circle_outline" />
                    </RemoveButton>
                )}
            </Header>
            <Content onClick={(e) => {
                e.stopPropagation();
            }}>
                {this.inputs.map(input => {
                    return (
                        <HandleWrapper key={input.name}>
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={input.name}
                            />
                            <InputLabel>{input.name}</InputLabel>
                        </HandleWrapper>
                    )
                })}
                <FormWrapper fluid>
                    {this.renderForm(data)}
                </FormWrapper>
                {this.outputs.map(output => {
                    return (
                        <HandleWrapper key={output.name}>
                            <OutputLabel>{output.name}</OutputLabel>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={output.name}
                            />
                        </HandleWrapper>
                    )
                })}
            </Content>
        </Wrapper>
    }
    renderForm(_data: Type) {
        return <></>;
    }
    onChange = (name: string, value: any) => {
        this.props.onChangeData(this.props.id, name, value);
    }
}