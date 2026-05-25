import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input, InputGroup, SelectPicker } from "rsuite";
import { useDebouncedValue } from "../../../../hooks/useDebouncedValue";
import { useAuditLogStore } from "../../store/auditLogStore";
import { QuickFilterChips } from "./QuickFilterChips";
import type { AuditLogFilters } from "../../types/auditLog.types";

const PICKER_PROPS = {
  popupClassName: "pro-picker-menu",
  className: "pro-picker-toggle",
} as const;

const PICKER_NO_SEARCH = { ...PICKER_PROPS, searchable: false } as const;

const DATE_RANGES: Array<{ label: string; value: AuditLogFilters["dateRange"] }> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
];

const TARGET_TYPES = [
  { label: "All targets", value: "all" },
  { label: "Payment", value: "payment" },
  { label: "Registration", value: "registration" },
];

type Props = {
  eventOptions: Array<{ label: string; value: string }>;
  total?: number;
};

export function AuditLogFilters({ eventOptions, total }: Props) {
  const filters = useAuditLogStore((s) => s.filters);
  const setFilters = useAuditLogStore((s) => s.setFilters);
  const resetFilters = useAuditLogStore((s) => s.resetFilters);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const eventPickerOptions = useMemo(
    () => [{ label: "All events", value: "" }, ...eventOptions],
    [eventOptions]
  );

  useEffect(() => {
    setFilters({ search: debouncedSearch.trim() });
  }, [debouncedSearch, setFilters]);

  const onReset = () => {
    resetFilters();
    setSearchInput("");
  };

  return (
    <div className="payments-toolbar app-card-flat p-4 space-y-4">
      <QuickFilterChips />
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
          <div className="min-w-[160px] sm:flex-1 xl:max-w-[180px]">
            <SelectPicker
              {...PICKER_NO_SEARCH}
              data={DATE_RANGES}
              value={filters.dateRange}
              onChange={(val) =>
                setFilters({
                  dateRange: (val as AuditLogFilters["dateRange"]) || "30d",
                })
              }
              block
              cleanable={false}
            />
          </div>
          <div className="min-w-[220px] sm:flex-1 xl:flex-none xl:w-[220px]">
            <SelectPicker
              {...PICKER_PROPS}
              data={eventPickerOptions}
              value={filters.eventId}
              onChange={(val) => setFilters({ eventId: String(val || "") })}
              placeholder="All events"
              block
              cleanable={false}
              searchable
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <InputGroup inside>
              <Input
                placeholder="Search action, actor, phone, target…"
                value={searchInput}
                onChange={setSearchInput}
              />
              <InputGroup.Addon>
                <Search size={16} />
              </InputGroup.Addon>
            </InputGroup>
          </div>
        </div>
        <button type="button" className="reg-toolbar-btn shrink-0" onClick={onReset}>
          <RotateCcw size={14} />
          Reset filters
        </button>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="min-w-[160px] sm:flex-1 xl:max-w-[180px]">
          <SelectPicker
            {...PICKER_NO_SEARCH}
            data={TARGET_TYPES}
            value={filters.targetType}
            onChange={(val) => setFilters({ targetType: String(val || "all") })}
            block
            cleanable={false}
          />
        </div>
        {typeof total === "number" && (
          <span className="text-sm text-app-muted sm:ml-auto self-center">
            {total} entr{total === 1 ? "y" : "ies"}
          </span>
        )}
      </div>
    </div>
  );
}
