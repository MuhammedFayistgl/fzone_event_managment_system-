import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input, InputGroup, SelectPicker } from "rsuite";
import { useDebouncedValue } from "../../../../hooks/useDebouncedValue";
import { useReconciliationStore } from "../../store/reconciliationStore";
import { QuickFilterChips } from "./QuickFilterChips";
import type {
  ReconciliationFilters,
  SettlementStatus,
} from "../../types/reconciliation.types";

type Props = {
  eventOptions: Array<{ label: string; value: string }>;
  total?: number;
};

const DATE_RANGES: Array<{
  label: string;
  value: ReconciliationFilters["dateRange"];
}> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "All payment status", value: "all" },
  { label: "Success", value: "success" },
  { label: "Pending", value: "created" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const SETTLEMENT_OPTIONS: Array<{
  label: string;
  value: SettlementStatus | "all";
}> = [
  { label: "All settlement", value: "all" },
  { label: "Settled", value: "settled" },
  { label: "Pending", value: "pending" },
  { label: "Unknown", value: "unknown" },
];

const PICKER_PROPS = {
  popupClassName: "pro-picker-menu",
  className: "pro-picker-toggle",
} as const;

const PICKER_PROPS_NO_SEARCH = {
  ...PICKER_PROPS,
  searchable: false,
} as const;

export function ReconciliationFilters({ eventOptions, total }: Props) {
  const filters = useReconciliationStore((s) => s.filters);
  const setFilters = useReconciliationStore((s) => s.setFilters);
  const resetFilters = useReconciliationStore((s) => s.resetFilters);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [amountMinInput, setAmountMinInput] = useState(filters.amountMin);
  const [amountMaxInput, setAmountMaxInput] = useState(filters.amountMax);

  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const debouncedAmountMin = useDebouncedValue(amountMinInput, 350);
  const debouncedAmountMax = useDebouncedValue(amountMaxInput, 350);

  const eventPickerOptions = useMemo(
    () => [{ label: "All events", value: "" }, ...eventOptions],
    [eventOptions]
  );

  useEffect(() => {
    setFilters({ search: debouncedSearch.trim() });
  }, [debouncedSearch, setFilters]);

  useEffect(() => {
    setFilters({ amountMin: debouncedAmountMin });
  }, [debouncedAmountMin, setFilters]);

  useEffect(() => {
    setFilters({ amountMax: debouncedAmountMax });
  }, [debouncedAmountMax, setFilters]);

  const onReset = () => {
    resetFilters();
    setSearchInput("");
    setAmountMinInput("");
    setAmountMaxInput("");
  };

  return (
    <div className="payments-toolbar app-card-flat p-4 space-y-4">
      <QuickFilterChips />

      <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
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

          <div className="min-w-[160px] sm:flex-1 xl:flex-none xl:w-[160px]">
            <SelectPicker
              {...PICKER_PROPS_NO_SEARCH}
              data={DATE_RANGES}
              value={filters.dateRange}
              onChange={(val) =>
                setFilters({
                  dateRange: (val as ReconciliationFilters["dateRange"]) || "30d",
                })
              }
              block
              cleanable={false}
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <InputGroup inside>
              <Input
                placeholder="Search transaction ID, customer, phone…"
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
        <div className="min-w-[180px] sm:flex-1 xl:max-w-[200px]">
          <SelectPicker
            {...PICKER_PROPS_NO_SEARCH}
            data={PAYMENT_STATUS_OPTIONS}
            value={filters.status}
            onChange={(val) => setFilters({ status: String(val || "all") })}
            placeholder="Payment status"
            block
            cleanable={false}
          />
        </div>

        <div className="min-w-[180px] sm:flex-1 xl:max-w-[200px]">
          <SelectPicker
            {...PICKER_PROPS_NO_SEARCH}
            data={SETTLEMENT_OPTIONS}
            value={filters.settlementStatus}
            onChange={(val) =>
              setFilters({
                settlementStatus: (val as SettlementStatus | "all") || "all",
              })
            }
            placeholder="Settlement status"
            block
            cleanable={false}
          />
        </div>

        <div className="min-w-[140px] sm:flex-1 xl:max-w-[160px]">
          <Input
            type="number"
            placeholder="Min amount"
            value={amountMinInput}
            onChange={setAmountMinInput}
          />
        </div>

        <div className="min-w-[140px] sm:flex-1 xl:max-w-[160px]">
          <Input
            type="number"
            placeholder="Max amount"
            value={amountMaxInput}
            onChange={setAmountMaxInput}
          />
        </div>

        {typeof total === "number" && (
          <span className="text-sm text-app-muted sm:ml-auto self-center">
            {total} transaction{total === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}
