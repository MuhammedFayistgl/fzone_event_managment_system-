import { Download, RefreshCw, Search } from "lucide-react";
import { Input, InputGroup, SelectPicker } from "rsuite";
import type {
  PaymentDateRange,
  PaymentLedgerStatus,
} from "../../Types/paymentLedger.types";

type EventOption = { label: string; value: string };

type Props = {
  events: EventOption[];
  eventId: string;
  status: PaymentLedgerStatus;
  dateRange: PaymentDateRange;
  search: string;
  total: number;
  loading?: boolean;
  onEventChange: (eventId: string) => void;
  onStatusChange: (status: PaymentLedgerStatus) => void;
  onDateRangeChange: (range: PaymentDateRange) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onClearFilters: () => void;
};

const STATUS_TABS: { value: PaymentLedgerStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
];

const DATE_RANGES: { value: PaymentDateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

export default function PaymentsToolbar({
  events,
  eventId,
  status,
  dateRange,
  search,
  total,
  loading = false,
  onEventChange,
  onStatusChange,
  onDateRangeChange,
  onSearchChange,
  onRefresh,
  onExport,
  onClearFilters,
}: Props) {
  const eventOptions = [{ label: "All events", value: "" }, ...events];

  return (
    <div className="payments-toolbar app-card-flat p-4 space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="min-w-[220px]">
            <SelectPicker
              data={eventOptions}
              value={eventId}
              onChange={(val) => onEventChange(String(val || ""))}
              placeholder="All events"
              block
              cleanable={false}
              searchable
              popupClassName="pro-picker-menu"
            />
          </div>
          <div className="min-w-[160px]">
            <SelectPicker
              data={DATE_RANGES}
              value={dateRange}
              onChange={(val) => onDateRangeChange((val as PaymentDateRange) || "all")}
              block
              cleanable={false}
              searchable={false}
              popupClassName="pro-picker-menu"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <InputGroup inside>
              <Input
                placeholder="Search phone, name, order or payment ID"
                value={search}
                onChange={onSearchChange}
              />
              <InputGroup.Addon>
                <Search size={16} />
              </InputGroup.Addon>
            </InputGroup>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="reg-toolbar-btn" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            className="reg-toolbar-btn reg-toolbar-btn--primary"
            onClick={onExport}
            disabled={loading || total === 0}
          >
            <Download size={15} /> Export CSV
          </button>
          <button type="button" className="reg-toolbar-btn" onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`reg-filter-chip ${status === tab.value ? "reg-filter-chip--active" : ""}`}
            onClick={() => onStatusChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-sm text-app-muted ml-auto">
          {total} payment{total === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
