import { Handle, Position, useStore } from "@xyflow/react";
import React from "react";
import styled from "styled-components";
import { ValueType } from "./node/BaseNode";
import NodeHandle from "./NodeHandle";

const StyledHandle = styled(NodeHandle)`
    left: -11px !important;
`

const ChildrenWrapper = styled.div`
    &.connected {
        opacity: 0.5;
        pointer-events: none;
    }
`


export default function InputHandle({ id, children, parentId, valueType }: { id: string, children: React.ReactNode, parentId: string, valueType: ValueType }) {
    const isConnected = useStore((s) => {
        return s.edges.some((edge) => edge.target === parentId && edge.targetHandle === id)
    })


    return <>
        <StyledHandle
            type="target"
            id={id}
            parentId={parentId}
            valueType={valueType}
        />
        <ChildrenWrapper className={isConnected ? "connected" : ""}>
            {children}
        </ChildrenWrapper>
    </>
}