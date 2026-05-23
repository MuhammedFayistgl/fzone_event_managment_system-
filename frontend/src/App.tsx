import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Overview from "./Body/Overview";
import InvestorsTable from "./components/InvestorsTable";
import SignupComponent from "./login/SiginComponent";
import LoginComponent from "./login/LoginComponent";
import { setAccessToken } from "./api/axios";
import CreateEventPage from "./pages/CreateEventPage";
import EventRegisterPage from "./pages/EventRegisterPage";
import RecentRegistrationsContainer from "./components/ResentRegistration/RecentRegistrationsContainer";
import EventCardDashbordDetils from "./components/running_eventCard/EventCardDashbordDetils";
import QRScanner from "./pages/GetScanner";
import AttendencePage from "./pages/attendence_Page/AttendencePage";
import EventAttendanceDetails from "./pages/attendence_Page/EventAttendanceDetails";
import SettingsPage from "./pages/SettingsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminShell from "./layouts/AdminShell";

const token = localStorage.getItem("accessToken");

if (token) {
  setAccessToken(token);
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginComponent />} />
      <Route path="/signup" element={<SignupComponent />} />

      <Route
        path="/"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <Overview />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <InvestorsTable />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <CreateEventPage />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/allregistrations"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <RecentRegistrationsContainer mode="full" />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/runningevent/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <EventCardDashbordDetils />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <EventRegisterPage />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gate-scanner"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <QRScanner />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance-logs"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <AttendencePage />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event-attendance/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <EventAttendanceDetails />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminShell>
              <SettingsPage />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  );
}

export default App;
