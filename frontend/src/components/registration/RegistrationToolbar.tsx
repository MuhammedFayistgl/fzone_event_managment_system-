import { Download, FileSpreadsheet, Filter } from "lucide-react";
import type { BlockFilter } from "../../Types/registrationAttendance.types";

type Props = {
  selectedCount: number;
  totalCount: number;
  blockFilter: BlockFilter;
  onBlockFilterChange: (filter: BlockFilter) => void;
  onDownloadSelected: () => void;
  onDownloadAll: () => void;
  onExportGuestCsv: () => void;
  busy?: boolean;
};

const FILTER_OPTIONS: { value: BlockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

export default function RegistrationToolbar({
  selectedCount,
  totalCount,
  blockFilter,
  onBlockFilterChange,
  onDownloadSelected,
  onDownloadAll,
  onExportGuestCsv,
  busy = false,
}: Props) {
  return (
    <div className="reg-attendance-toolbar">
      <div className="reg-attendance-toolbar__left">
        <span className="text-sm text-app-muted">
          {selectedCount > 0 ? `${selectedCount} selected · ` : ""}
          {totalCount} registration{totalCount === 1 ? "" : "s"}
        </span>
        <div className="reg-attendance-toolbar__filters">
          <Filter size={14} className="text-app-muted" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`reg-filter-chip ${blockFilter === opt.value ? "reg-filter-chip--active" : ""}`}
              onClick={() => onBlockFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reg-attendance-toolbar__actions">
        <button
          type="button"
          className="reg-toolbar-btn"
          onClick={onExportGuestCsv}
          disabled={busy || totalCount === 0}
        >
          <FileSpreadsheet size={15} /> Guest CSV
        </button>
        <button
          type="button"
          className="reg-toolbar-btn"
          onClick={onDownloadSelected}
          disabled={busy || selectedCount === 0}
        >
          <Download size={15} /> Selected PDFs
        </button>
        <button
          type="button"
          className="reg-toolbar-btn reg-toolbar-btn--primary"
          onClick={onDownloadAll}
          disabled={busy || totalCount === 0}
        >
          <Download size={15} /> All tickets
        </button>
      </div>
    </div>
  );
}
