import { Form, Panel, ButtonToolbar, Button, Animation } from 'rsuite';

import { ReactNode } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3000;
`

const Mask = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    background-color: var(--rs-gray-900);
    transition: opacity 1s linear;
    opacity: 0.8;
`

const PopupPanel = styled(Panel)`
    z-index: 40;
    background-color: var(--rs-gray-900);
    width: 393px;    
    margin: 5% auto;
    .rs-panel-body {
        padding: 15px;
        max-height: 370px;
        overflow: auto;
    }
    .rs-form-group > div {
        width: 100%;
    }
    .rs-form:not(.rs-form-inline) .rs-form-group:first-child {
        margin-top: 10px;
    }
    .rs-form:not(.rs-form-inline) .rs-form-group:not(:last-child) {
        margin-bottom: 10px;
    }
    .rs-form:not(.rs-form-inline) .rs-form-group:last-child {
        margin-top: 18px;
    }
    .rs-panel-header {
        font-weight: normal;
    }
`

type PopupProps = {
    children: ReactNode;
    title: string;
    show: boolean;
    onOK?: () => void;
    onCancel?: () => void;
    showOKCancel?: boolean;
}

export default function Popup({ children, title, show, onOK, onCancel, showOKCancel = true }: PopupProps) {

    return (
        <>
            {show && <Overlay>
                <Mask />
                <Animation.Collapse in={show}>
                    <PopupPanel header={title} bordered>
                        <Form autoComplete="off">
                            {children}
                            {showOKCancel && (
                                <Form.Group>
                                    <ButtonToolbar>
                                        <Button size="xs" appearance="primary" onClick={onOK}>OK</Button>
                                        <Button size="xs" appearance="default" onClick={onCancel}>Cancel</Button>
                                    </ButtonToolbar>
                                </Form.Group>
                            )}
                        </Form>
                    </PopupPanel>
                </Animation.Collapse>
            </Overlay>}
        </>
    );
}