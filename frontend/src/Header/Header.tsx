import type { FC } from 'react';
import { Navbar, Menu, Avatar, Drawer } from 'rsuite';
import Swal from 'sweetalert2'
import API from '../api/axios';
import { useNavigate } from 'react-router';


interface HeaderProps { }

const Header: FC<HeaderProps> = () => {
    const navigate = useNavigate()

    const logOut = () => {
        Swal.fire({
            title: "Logout?",
            text: "You will need to login again.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Logout"
        }).then(async (result) => {

            if (result.isConfirmed) {

                // ✅ remove token
                localStorage.removeItem("accessToken");

                // ✅ optional backend logout API
                await API.post("/admin/logout");

                // ✅ success message
                await Swal.fire({
                    title: "Logged Out!",
                    text: "Successfully logged out.",
                    icon: "success"
                });

                // ✅ redirect
                navigate("/login");
            }
        });
    };

    return (<>
        <Navbar>
            <Navbar.Content>
                {({ onClose }) => {
                    return (
                        <>
                            <Navbar.Toggle aria-label="Toggle navigation" />
                            <Navbar.Drawer placement="left" size="xs">
                                <Drawer.Header>
                                    <Drawer.Title>Menu</Drawer.Title>
                                </Drawer.Header>
                                <Drawer.Body>
                                    <Menu onSelect={onClose}>
                                        <Menu.Item>Docs</Menu.Item>
                                        <Menu.Item>Components</Menu.Item>
                                        <Menu.Item>Tools</Menu.Item>
                                    </Menu>
                                </Drawer.Body>
                            </Navbar.Drawer>
                            <Navbar.Brand href="#">
                                <Avatar src="src\assets\F-zone logo only_ png.svg" circle size="sm" />
                                {/* <Text color="blue" fontFamily={'ui-monospace'} size="">Admin Console</Text> */}
                            </Navbar.Brand>
                        </>
                    );
                }}
            </Navbar.Content>

            {/* <Avatar src="src\assets\F-zone logo only_ png.svg" circle size="sm" /> */}
            <div onClick={logOut}>
                Sign Out </div>
        </Navbar>

    </>);
}

export default Header;
