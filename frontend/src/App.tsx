import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Header from "./Header/Header";
import Overview from "./Body/Overview";
import InvestorsTable from "./components/InvestorsTable";
import NaveBarSecond from "./Header/TableHeader";
// import LoginPage from "./components/Login";
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



const token = localStorage.getItem("accessToken");

if (token) {
  setAccessToken(token);
}


function App() {
  return (


    <Routes>


      <Route path="/login" element={<LoginComponent />} />
      <Route path="/signup" element={<SignupComponent />} />

      {/* ADMIN */}
      <Route
        path="/"
        element={
          <ProtectedRoute role="admin">
            <>
              <Header />
              <Overview />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management"
        element={
          <ProtectedRoute role="admin">
            <>
              <NaveBarSecond />
              <InvestorsTable />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/event"
        element={
          <ProtectedRoute role="admin">
            <>
              <CreateEventPage />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/allregistrations"
        element={
          <ProtectedRoute role="admin">
            <>
              <RecentRegistrationsContainer mode="full" />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/runningevent/:id"
        element={
          <ProtectedRoute role="admin">
            <>
              <EventCardDashbordDetils />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:id"
        element={
          <ProtectedRoute role="admin">
            <>
              <EventRegisterPage />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gate-scanner"
        element={
          <ProtectedRoute role="admin">
            <>
              <QRScanner />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance-logs"
        element={
          <ProtectedRoute role="admin">
            <>
              <AttendencePage />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/event-attendance/:id"
        element={
          <ProtectedRoute role="admin">
            <>
              <EventAttendanceDetails />
            </>
          </ProtectedRoute>
        }
      />


      {/* Unauthorized */}
      <Route path="/unauthorized" element={<h1>Unauthorized</h1>} />

    </Routes>

  );
}

export default App;



//attendance-logs