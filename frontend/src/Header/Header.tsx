import type { FC } from 'react';
import { Navbar, Menu, Avatar, Drawer } from 'rsuite';
import { Settings, Moon, Sun } from 'lucide-react';
import Swal from 'sweetalert2'
import API from '../api/axios';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { toggleTheme } from '../redux/store/slices/themeSlice';
import { clearAccessToken } from '../utils/authRole';
import { disconnectLiveSocket } from '../live/socket';
import { NotificationBell } from '../features/notifications/components/NotificationBell';
import logoUrl from '../assets/F-zone logo only_ png.svg';


interface HeaderProps { }

const Header: FC<HeaderProps> = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const themeMode = useAppSelector((s) => s.theme.mode)

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
                clearAccessToken();
                disconnectLiveSocket();

                await API.post("/admin/logout");

                await Swal.fire({
                    title: "Logged Out!",
                    text: "Successfully logged out.",
                    icon: "success"
                });

                navigate("/login");
            }
        });
    };

    return (<>
        <Navbar className="admin-navbar">
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
                                        <Menu.Item onClick={() => navigate("/")}>Overview</Menu.Item>
                                        <Menu.Item onClick={() => navigate("/settings")}>Settings</Menu.Item>
                                    </Menu>
                                </Drawer.Body>
                            </Navbar.Drawer>
                            <Navbar.Brand href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
                                <Avatar src={logoUrl} circle size="sm" />
                            </Navbar.Brand>
                        </>
                    );
                }}
            </Navbar.Content>

            <div className="flex items-center gap-4">
                <NotificationBell />
                <button
                    type="button"
                    onClick={() => dispatch(toggleTheme())}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-app-border bg-app-surface-muted text-app-secondary hover:text-app-accent hover:border-app-border-strong transition"
                    title={themeMode === "dark" ? "Switch to light" : "Switch to dark"}
                >
                    {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="flex items-center gap-1.5 text-sm text-app-muted hover:text-app-accent transition"
                    title="Settings"
                >
                    <Settings size={18} />
                    <span className="hidden sm:inline">Settings</span>
                </button>
                <button
                    type="button"
                    onClick={logOut}
                    className="text-sm text-app-muted hover:text-red-500 transition cursor-pointer"
                >
                    Sign Out
                </button>
            </div>
        </Navbar>

    </>);
}

export default Header;
