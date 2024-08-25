import { Handle, Position } from "@xyflow/react";
import React from "react";
import styled from "styled-components";

const StyledHandle = styled(Handle)`
    position: absolute;
    top: 68%;
    left: -14px;
    transform: translateY(-50%);
`


export default function InputHandle({ id, children }: { id: string, children: React.ReactNode }) {
    return <>
        <StyledHandle
            type="target"
            position={Position.Left}
            id={id}
        />
        {children}
    </>
}