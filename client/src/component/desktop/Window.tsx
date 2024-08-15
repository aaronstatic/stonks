import React, { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import { DraggableData, Rnd } from "react-rnd";
import { Windows } from "../../App";
import { Button } from "rsuite";
import Icon from "../Icon";

const WindowWrapper = styled(Rnd)`
    border: 1px solid var(--rs-gray-700);
    display: flex !important;
    flex-direction: column;
`

const TitleBar = styled.div`
    text-align: left;
    padding: 8px;
    background-color: var(--rs-gray-700);
    cursor: move;
    color: var(--rs-gray-400);
`

const Content = styled.div`
    padding: 8px;
    background-color: var(--rs-gray-800);    
    flex: 1;
    text-align: left;
    position: relative;
    overflow: auto;
`

const WindowButtons = styled.div`
   float: right;
`

type WindowProps = {
    title: string;
    children: React.ReactNode;
    windowId: string;
    defaultSize?: { width: number, height: number };
};

export default function Window({ title, children, windowId, defaultSize = { width: 400, height: 400 } }: WindowProps) {
    const [zIndex, setZIndex] = useState(1000);
    const api = useContext(Windows);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: defaultSize.width, height: defaultSize.height });

    const bringToFront = () => {
        //get max z-index
        let maxZIndex = 1000;
        for (const id in api.windows) {
            if (api.windows[id].zIndex > maxZIndex) {
                maxZIndex = api.windows[id].zIndex;
            }
        }

        setZIndex(maxZIndex + 1);
        api.windows[windowId].zIndex = maxZIndex + 1;
    }

    const savePosition = (x: number, y: number) => {
        const windows = JSON.parse(localStorage.getItem("windowPositions") || "{}");
        windows[windowId] = { x, y };
        localStorage.setItem("windowPositions", JSON.stringify(windows));
    }

    const saveSize = (width: number, height: number) => {
        const windows = JSON.parse(localStorage.getItem("windowSizes") || "{}");
        windows[windowId] = { width, height };
        localStorage.setItem("windowSizes", JSON.stringify(windows));
    }

    useEffect(() => {
        const windows = JSON.parse(localStorage.getItem("windowPositions") || "{}");
        const position = windows[windowId];
        if (position) {
            setPosition(position);
        }

        const sizes = JSON.parse(localStorage.getItem("windowSizes") || "{}");
        const size = sizes[windowId];
        if (size) {
            setSize(size);
        }
    }, []);

    return (
        <WindowWrapper
            id={windowId}
            className="window"
            style={{
                zIndex: zIndex,
            }}
            position={position}
            size={size}
            default={{
                x: 0,
                y: 0,
                width: defaultSize.width,
                height: defaultSize.height
            }}
            minWidth={320}
            minHeight={200}
            bounds="window"
            dragHandleClassName="title-bar"
            onDragStart={() => {
                bringToFront();
            }}
            onResizeStart={() => {
                bringToFront();
            }}
            onDragStop={(_e: any, d: DraggableData) => {
                setPosition({ x: d.x, y: d.y });
                savePosition(d.x, d.y);
            }}
            onResizeStop={(_e: any, _direction: any, ref: any, _delta: any, position: any) => {
                setSize({ width: ref.style.width, height: ref.style.height });
                savePosition(position.x, position.y);
                saveSize(ref.style.width, ref.style.height);
            }}
        >
            <TitleBar className="title-bar">
                <span className="title-bar-text">{title}</span>
                <WindowButtons>
                    <Button size="xs" onClick={() => api.closeWindow(windowId)}>
                        <Icon name="close" />
                    </Button>
                </WindowButtons>
            </TitleBar>
            <Content className="window-body">{children}</Content>
        </WindowWrapper>
    );
}