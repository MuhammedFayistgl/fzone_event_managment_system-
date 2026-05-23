import type { FC } from 'react';
import { Badge, Button, Nav, Navbar, NavbarBrand } from 'rsuite';
import { TiArrowBack } from "react-icons/ti";
import { NavLink } from 'react-router';
interface NaveBarSecondProps { }

const NaveBarSecond: FC<NaveBarSecondProps> = () => {
    return (<>
        <Navbar>
            <Navbar.Content showFrom="xs">
                <NavbarBrand />
                <Nav>

                    <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Button style={{ marginRight: 10 }} startIcon={<TiArrowBack size={25} />} > Previous </Button>

                    </NavLink>

                    {/* <Button appearance="primary">Add User </Button> */}

                </Nav>
            </Navbar.Content>

            <Navbar.Content hideFrom="xs">
                <Navbar.Toggle />
                <NavbarBrand />
            </Navbar.Content>

            <Navbar.Content>
                <Badge content={6} shape="circle">

                </Badge>

            </Navbar.Content>
        </Navbar>

    </>);
}

export default NaveBarSecond;
