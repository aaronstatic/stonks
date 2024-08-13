import { Button, Form, HStack, Input, Nav, SelectPicker, Sidenav } from "rsuite";
import { MenuItem, UserData } from "../../App";
import styled from "styled-components";
import { useContext, useEffect, useState } from "react";
import Server from "../../lib/Server";
import Popup from "../Popup";

const Icon = styled.span`
    margin-right: 10px;
`

const Logo = styled.img`
    width: 100px;
    margin: 20px auto;
    display: flex;
`
const AddButton = styled(Button)`
    margin-left: 5px;
    margin-right: 20px;
`

interface MenuProps {
    items: MenuItem[];
    onClick: (type: string, id: string) => void;
}

export default function Menu({ items, onClick }: MenuProps) {
    const [portfolios, setPortfolios] = useState<{ name: string, id: string }[]>([]);
    const [showAddPortfolio, setShowAddPortfolio] = useState(false);
    const [portfolioName, setPortfolioName] = useState("New Portfolio");

    const userData = useContext(UserData);

    useEffect(() => {
        Server.getPortfolios().then(setPortfolios);
    }, []);

    if (!userData) return null;

    return (
        <>
            <Sidenav.Header>
                <Logo src="/img/stonks-logo.png" alt="logo" />
            </Sidenav.Header>
            <Sidenav expanded={true} appearance="subtle">
                <Sidenav.Body>
                    <HStack style={{ marginLeft: 20 }}>
                        {portfolios.length > 0 && (
                            <SelectPicker
                                cleanable={false}
                                searchable={false}
                                style={{ marginLeft: 20, width: 200 }}
                                data={portfolios}
                                value={userData.portfolioId}
                                onChange={(value) => {
                                    if (!value) return;
                                    Server.setPortfolio(value);
                                }}
                            />
                        )}

                        <AddButton className="material-symbols-outlined" size="xs" onClick={() => {
                            //add a portfolio, popup for name
                            setShowAddPortfolio(true);

                        }}>
                            add
                        </AddButton>
                    </HStack>
                    <Nav>
                        {items.map(item => (
                            <Nav.Item key={item.id} onClick={() => onClick(item.id, item.id)}>
                                <Icon className="material-symbols-outlined">
                                    {item.icon}
                                </Icon>
                                {item.title}
                            </Nav.Item>
                        ))}
                    </Nav>
                </Sidenav.Body>
            </Sidenav>
            <Popup
                title="Add Portfolio"
                onOK={() => {
                    Server.addPortfolio(portfolioName).then((result: { name: string, _id: string }) => {
                        setPortfolios([...portfolios, { name: result.name, id: result._id }]);
                        setPortfolioName("New Portfolio");
                    });
                    setShowAddPortfolio(false);
                }}
                onCancel={() => {
                    setShowAddPortfolio(false);
                    setPortfolioName("New Portfolio");
                }}
                show={showAddPortfolio}
            >
                <Form.Group>
                    <Form.ControlLabel>Portfolio Name</Form.ControlLabel>
                    <Input
                        value={portfolioName}
                        onChange={(value) => setPortfolioName(value)}
                    />
                </Form.Group>
            </Popup>
        </>
    );

}