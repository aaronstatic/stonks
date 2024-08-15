import React from "react";
import { Button } from "rsuite";
import Server from "../lib/Server";
import Popup from "./Popup";
import Object from "@schema/object";
import Icon from "./Icon";
import styled from "styled-components";

export interface CRUDState {
    showPopup: boolean;
    selectedObject: Object | null;
    data: Object[];
    filter: any;
}

const ButtonIcon = styled(Icon)`
    margin-right: 5px;
`

class CRUD extends React.Component<any, CRUDState> {

    defaultValues: Object = {
        owner: "",
        _id: "new",
        name: ""
    };

    displayName: string = "Object";

    type: string = "object";

    constructor(props: any) {
        super(props);
        this.state = {
            showPopup: false,
            selectedObject: null,
            data: [],
            filter: null
        };
    }

    refreshOnChange: boolean = false;

    showOpenButton: boolean = true;

    static defaultSize = {
        width: 400,
        height: 400
    }

    componentDidMount() {
        this.load();
    }

    sort(): ((a: any, b: any) => number) | null {
        return null;
    }

    load() {
        if (this.state.filter) {
            Server.query(this.type, this.state.filter).then((objects) => {
                const sortFn = this.sort();
                if (sortFn) {
                    objects.sort(sortFn);
                }
                this.setState({ data: [...objects] });
            });
        } else {
            Server.getAll(this.type).then((objects) => {
                const sortFn = this.sort();
                if (sortFn) {
                    objects.sort(sortFn);
                }
                this.setState({ data: [...objects] });
            });
        }
    }

    setShowPopup = (show: boolean) => {
        this.setState({ showPopup: show });
    }

    setSelectedObject(object: Object | null) {
        this.setState({ selectedObject: object });
    }

    getFormData() {
        const { selectedObject } = this.state;
        return selectedObject;
    }

    openObject = (_id: string) => {
        Server.emit("open-object", { type: this.type, id: _id });
    }

    onEditOK = () => {
        const { data } = this.state;
        const selectedObject = this.getFormData();

        this.setShowPopup(false);

        if (selectedObject?._id === "new") {
            Server.create(this.type, selectedObject).then((ob) => {
                if (this.refreshOnChange) {
                    this.load();
                    return;
                }
                this.setState({ data: [...data, ob] });
            });
        } else {
            Server.update(this.type, selectedObject?._id as string, selectedObject as Object).then((ob) => {
                if (this.refreshOnChange) {
                    this.load();
                    return;
                }
                const index = data.findIndex((p) => p._id === ob._id);
                data[index] = ob;
                this.setState({ data: [...data] });
            });
        }
    }

    onDelete = (id: string) => {
        const { data } = this.state;
        Server.delete(this.type, id).then(() => {
            if (this.refreshOnChange) {
                this.load();
                return;
            }
            const index = data.findIndex((p) => p._id === id);
            data.splice(index, 1);
            this.setState({ data: [...data] });
        });
    }

    renderData() {
        return (<></>);
    }

    renderForm() {
        return <></>;
    }

    editObject = (id: string) => {
        Server.get(this.type, id).then((object) => {
            this.setSelectedObject(object);
            this.setShowPopup(true);
        });
    }

    render() {
        const { showPopup } = this.state;

        return (
            <>
                <Button size="md" color="green" onClick={() => {
                    const newObject = { ...this.defaultValues };
                    this.setSelectedObject(newObject);
                    this.setShowPopup(true);
                }}>
                    <ButtonIcon name="add" />
                    Add New {this.displayName}
                </Button>
                <br /><br />
                {this.renderData()}
                <Popup
                    title={"Add New " + this.displayName}
                    show={showPopup}
                    onOK={this.onEditOK}
                    onCancel={() => {
                        this.setShowPopup(false);
                    }}
                >
                    {this.renderForm()}
                </Popup>
            </>
        );
    }
}

export default CRUD;
