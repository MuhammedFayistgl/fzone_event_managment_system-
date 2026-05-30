import { useMaintenanceStatus } from "../features/platform-control-center/hooks/usePlatformOpsQueries";

export default function MaintenanceBanner() {
  const { data } = useMaintenanceStatus();

  if (!data?.maintenanceMode) return null;

  return (
    <div className="pcc-maintenance-banner" role="status">
      {data.maintenanceMessage ||
        "Maintenance mode is active. Public registration routes are temporarily unavailable."}
    </div>
  );
}
