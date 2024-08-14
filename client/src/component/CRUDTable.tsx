import { Button, Form, Table } from "rsuite";
import CRUD from "../component/CRUD";
import Object from "@schema/object";
import styled from "styled-components";

const { Column, HeaderCell, Cell } = Table;

const ActionButton = styled(Button)`
    margin-left: 2px;
`;


class CRUDTable extends CRUD {
    getName(item: Object) {
        return item.name;
    }

    renderColumns() {
        return (
            <Column width={200}>
                <HeaderCell>Name</HeaderCell>
                <Cell dataKey="name" />
            </Column>
        )
    }

    renderData() {
        const { data } = this.state;
        return (
            <Table data={data} autoHeight={true} onDoubleClick={(e) => {
                const target = e.target as HTMLElement;
                if (target) {
                    const row = target.closest(".rs-table-row");
                    if (!row) return;
                    const rowNum = row.getAttribute("aria-rowindex");
                    const id = data[parseInt(rowNum as string) - 2]._id;
                    if (!id) return;
                    this.onOpen(id);
                }
            }}>
                <Table.Column width={80}>
                    <Table.HeaderCell>&nbsp;</Table.HeaderCell>
                    <Table.Cell>
                        {rowData => (
                            <Button size="xs" onClick={() => this.onOpen(rowData._id)}>Open</Button>
                        )}
                    </Table.Cell>
                </Table.Column>
                {this.renderColumns()}
                <Table.Column width={130}>
                    <Table.HeaderCell>...</Table.HeaderCell>
                    <Table.Cell>
                        {rowData => (
                            <>
                                <ActionButton size="xs" onClick={() => {
                                    this.editObject(rowData._id);
                                }}>Edit</ActionButton>
                                <ActionButton size="xs" onClick={() => {
                                    this.onDelete(rowData._id);
                                }}>Delete</ActionButton>
                            </>
                        )}
                    </Table.Cell>
                </Table.Column>
            </Table>
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

export default CRUDTable;
