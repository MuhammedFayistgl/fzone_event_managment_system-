import Swal from "sweetalert2";
import { useNavigate } from "react-router";
import API from "../api/axios";
import { clearAccessToken } from "../utils/authRole";
import { clearAdminProfileCache } from "./useAdminProfile";
import { disconnectLiveSocket } from "../live/socket";

export function useAdminLogout() {
  const navigate = useNavigate();

  const logOut = () => {
    Swal.fire({
      title: "Logout?",
      text: "You will need to login again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      clearAccessToken();
      clearAdminProfileCache();
      disconnectLiveSocket();

      await API.post("/admin/logout");

      await Swal.fire({
        title: "Logged Out!",
        text: "Successfully logged out.",
        icon: "success",
      });

      navigate("/login");
    });
  };

  return { logOut };
}
