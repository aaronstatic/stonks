import { Button, FlexboxGrid, Form, List } from "rsuite";
import styled from "styled-components";
import CRUD from "../component/CRUD";
import Object from "@schema/object";

const Item = styled(List.Item)`
    padding: 10px;
`;

const Name = styled(FlexboxGrid.Item)`
    /* Add your styles here */
`;

const ButtonContainer = styled(FlexboxGrid.Item)`
    margin-left: 2px;
`;

class CRUDList extends CRUD {
    getName(item: Object) {
        return item.name;
    }

    renderItem(item: Object) {
        return (
            <Name colspan={15}>
                {this.getName(item)}
            </Name>
        )
    }

    renderData() {
        const { data } = this.state;
        return (
            <List hover>
                {data.map((item) => (
                    <Item key={item._id} onDoubleClick={() => { this.onOpen(item._id) }}>
                        <FlexboxGrid>
                            {this.renderItem(item)}
                            <ButtonContainer>
                                <Button size="xs" onClick={() => {
                                    this.setSelectedObject(item);
                                    this.setShowPopup(true);
                                }}>Edit</Button>
                            </ButtonContainer>
                            <ButtonContainer>
                                <Button size="xs" color="red" onClick={() => {
                                    this.onDelete(item._id);
                                }}>Delete</Button>
                            </ButtonContainer>
                        </FlexboxGrid>
                    </Item>
                ))}
            </List>
        )
    }

    onOpen = (_id: string) => {

    }

    renderForm() {
        const { selectedObject } = this.state;
        return (
            <Form.Group controlId="name">
                <Form.ControlLabel>Name</Form.ControlLabel>
                <Form.Control
                    name="name"
                    value={selectedObject?.name || ""}
                    onChange={(value) => this.onFieldChange("name", value)}
                />
            </Form.Group>
        )
    }

    onFieldChange = (name: string, value: any) => {
        const { selectedObject } = this.state;
        this.setSelectedObject({
            ...selectedObject,
            [name]: value
        } as Object);
    }
}

export default CRUDList;
