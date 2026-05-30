import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import AssistantErrorBoundary from "./components/AssistantErrorBoundary";

const RegistrationAssistantWidget = lazy(
  () => import("./RegistrationAssistantWidget")
);

export default function RegistrationAssistantMount() {
  const location = useLocation();
  const onPublicRoute =
    location.pathname.startsWith("/event/") ||
    location.pathname.startsWith("/portal/");

  if (!onPublicRoute) return null;

  return (
    <AssistantErrorBoundary>
      <Suspense fallback={null}>
        <RegistrationAssistantWidget />
      </Suspense>
    </AssistantErrorBoundary>
  );
}
