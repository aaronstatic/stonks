import { Nav, Sidenav } from "rsuite";
import { MenuItem } from "../../App";
import styled from "styled-components";

const Icon = styled.span`
    margin-right: 10px;
`

const Logo = styled.img`
    width: 100px;
    margin: 20px auto;
    display: flex;
`

interface MenuProps {
    items: MenuItem[];
    onClick: (type: string, id: string) => void;
}

export default function Menu({ items, onClick }: MenuProps) {
    return (
        <>
            <Sidenav.Header>
                <Logo src="/img/stonks-logo.png" alt="logo" />
            </Sidenav.Header>
            <Sidenav expanded={true} appearance="subtle">
                <Sidenav.Body>
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

        </>
    );

}