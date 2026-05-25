import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminShell from "./layouts/AdminShell";
import PublicShell from "./layouts/PublicShell";
import { setAccessToken } from "./api/axios";
import LoginComponent from "./login/LoginComponent";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import EventRegisterPage from "./pages/EventRegisterPage";
import InvestorPortalPage from "./pages/InvestorPortalPage";

const Overview = lazy(() => import("./Body/Overview"));
const InvestorsTable = lazy(() => import("./components/InvestorsTable"));
const CreateEventPage = lazy(() => import("./pages/CreateEventPage"));
const RecentRegistrationsContainer = lazy(
  () => import("./components/ResentRegistration/RecentRegistrationsContainer")
);
const EventCardDashbordDetils = lazy(
  () => import("./components/running_eventCard/EventCardDashbordDetils")
);
const QRScanner = lazy(() => import("./pages/GetScanner"));
const AttendencePage = lazy(() => import("./pages/attendence_Page/AttendencePage"));
const PaymentsPage = lazy(() => import("./pages/payments/PaymentsPage"));
const EventAttendanceDetails = lazy(
  () => import("./pages/attendence_Page/EventAttendanceDetails")
);
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AuditLogPage = lazy(() => import("./pages/platform/AuditLogPage"));
const WebhooksPage = lazy(() => import("./pages/platform/WebhooksPage"));
const FinanceReconciliationPage = lazy(
  () => import("./pages/platform/FinanceReconciliationPage")
);
const NotificationCenterPage = lazy(
  () => import("./features/notifications/pages/NotificationCenterPage")
);
const InvestorDataStudioPage = lazy(
  () => import("./features/investor-data-studio/pages/InvestorDataStudioPage")
);

const ADMIN_ROLES = ["admin"];
const STAFF_ROLES = ["admin", "scanner", "finance"];
const SCANNER_ROLES = ["admin", "scanner"];
const FINANCE_ROLES = ["admin", "finance"];

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-app-muted">
      Loading…
    </div>
  );
}

function SuspensePage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

import { getAccessToken } from "./utils/authRole";

const token = getAccessToken();
if (token) setAccessToken(token);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginComponent />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />

      <Route
        path="/event/:id"
        element={
          <PublicShell>
            <EventRegisterPage />
          </PublicShell>
        }
      />

      <Route path="/portal/:eventId" element={<InvestorPortalPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <AdminShell>
              <SuspensePage>
                <Overview />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminShell>
              <SuspensePage>
                <InvestorsTable />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management/data-studio"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminShell>
              <SuspensePage>
                <InvestorDataStudioPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminShell>
              <SuspensePage>
                <CreateEventPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/allregistrations"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <AdminShell>
              <SuspensePage>
                <RecentRegistrationsContainer mode="full" />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/runningevent/:id"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <AdminShell>
              <SuspensePage>
                <EventCardDashbordDetils />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gate-scanner"
        element={
          <ProtectedRoute roles={SCANNER_ROLES}>
            <AdminShell>
              <SuspensePage>
                <QRScanner />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance-logs"
        element={
          <ProtectedRoute roles={SCANNER_ROLES}>
            <AdminShell>
              <SuspensePage>
                <AttendencePage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute roles={FINANCE_ROLES}>
            <AdminShell>
              <SuspensePage>
                <PaymentsPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/reconciliation"
        element={
          <ProtectedRoute roles={FINANCE_ROLES}>
            <AdminShell>
              <SuspensePage>
                <FinanceReconciliationPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event-attendance/:id"
        element={
          <ProtectedRoute roles={SCANNER_ROLES}>
            <AdminShell showGlow={false}>
              <SuspensePage>
                <EventAttendanceDetails />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={STAFF_ROLES}>
            <AdminShell>
              <SuspensePage>
                <NotificationCenterPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminShell>
              <SuspensePage>
                <SettingsPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/platform/audit-log"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminShell>
              <SuspensePage>
                <AuditLogPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/platform/webhooks"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminShell>
              <SuspensePage>
                <WebhooksPage />
              </SuspensePage>
            </AdminShell>
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
