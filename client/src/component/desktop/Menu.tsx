import { Avatar, Button, Form, HStack, Input, Nav, SelectPicker, Sidenav } from "rsuite";
import { MenuItem, UserData } from "../../App";
import styled from "styled-components";
import { useContext, useEffect, useState } from "react";
import Server from "../../lib/Server";
import Popup from "../Popup";

const Icon = styled.span`
    margin-right: 10px;
    @media (max-width: 900px) {
        margin-right: 0;
    }
`

const Logo = styled.img`
    width: 100px;
    margin: 20px auto;
    display: flex;
    @media (max-width: 900px) {
        width: 30px;
        display: inline-block;
        margin: 7px;
    }
`
const AddButton = styled(Button)`
    margin-left: 5px;
    margin-right: 20px;
`

const Footer = styled.div`
    margin-top: auto;
    padding: 20px;
`

const Username = styled.div`
    margin-left: 10px;
    color: var(--rs-sidenav-subtle-text);
`

interface MenuProps {
    items: MenuItem[];
    onClick: (type: string, id: string) => void;
    mobile?: boolean;
}

export default function Menu({ items, onClick, mobile }: MenuProps) {
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
            {!mobile && (
                <>
                    <Sidenav.Header>
                        <Logo src="/img/stonks-logo.png" alt="logo" />
                    </Sidenav.Header>
                    <Sidenav expanded={true} appearance="subtle">
                        <Sidenav.Body>
                            <HStack justifyContent="center">
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
                            <Nav style={{ marginTop: 20 }}>
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
                    <Footer>
                        <HStack justifyContent="center">
                            <Avatar color="green" src={userData.avatar} circle />
                            <Username>{userData.name}</Username>
                        </HStack>
                    </Footer>
                </>
            )}
            {mobile && (
                <>
                    <Nav>
                        <Logo onClick={() => onClick("dashboard", "dashboard")} src="/img/stonks-logo.png" alt="logo" />
                        {items.map(item => (
                            <Nav.Item key={item.id} onClick={() => onClick(item.id, item.id)}>
                                <Icon className="material-symbols-outlined">
                                    {item.icon}
                                </Icon>
                            </Nav.Item>
                        ))}
                    </Nav>
                </>
            )}

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