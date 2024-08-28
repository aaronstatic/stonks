import { Handle, HandleType, Position, useStore } from "@xyflow/react";
import styled from "styled-components";
import { ValueType } from "./node/BaseNode";

const StyledHandle = styled(Handle)`
    position: absolute;
    top: 68%;
    &.react-flow__handle-left {
        left: 0;
    }
    &.react-flow__handle-right {
        right: -5px;
        transform: translateY(-80%);
    }
`

export default function NodeHandle({ className, id, parentId, type, valueType }: { className?: string, id: string, parentId: string, type: HandleType, valueType: ValueType }) {
    const isConnected = useStore((s) => {
        return s.edges.some((edge) => (edge.target === parentId && edge.targetHandle === id) || (edge.source === parentId && edge.sourceHandle === id))
    });
    return <>
        <StyledHandle
            type={type}
            position={type === 'source' ? Position.Right : Position.Left}
            id={id}
            className={className + " " + valueType + (isConnected ? ' connected' : '')}
        />
    </>
}