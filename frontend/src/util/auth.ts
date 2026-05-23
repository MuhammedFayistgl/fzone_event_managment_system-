import { jwtDecode } from "jwt-decode";

export const isTokenValid = () => {
    const token = localStorage.getItem("token");

    if (!token) return false;

    try {
        const decoded: any = jwtDecode(token);

        // expiry check
        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            return false;
        }

        return true;

    } catch (err) {
        return false;
    }
};