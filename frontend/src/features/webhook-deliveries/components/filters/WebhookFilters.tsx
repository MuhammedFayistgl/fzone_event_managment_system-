import { useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input, InputGroup, SelectPicker } from "rsuite";
import { useDebouncedValue } from "../../../../hooks/useDebouncedValue";
import { useWebhookStore } from "../../store/webhookStore";
import { QuickStatusChips } from "./QuickStatusChips";
import type { WebhookFilters } from "../../types/webhook.types";
import { EVENT_TYPE_OPTIONS } from "../../types/webhook.types";

const PICKER_PROPS = {
  popupClassName: "pro-picker-menu",
  className: "pro-picker-toggle",
} as const;

const PICKER_NO_SEARCH = { ...PICKER_PROPS, searchable: false } as const;

const DATE_RANGES: Array<{ label: string; value: WebhookFilters["dateRange"] }> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
];

const HTTP_STATUS_OPTIONS = [
  { label: "All HTTP", value: "all" },
  { label: "200 OK", value: "200" },
  { label: "400 Bad Request", value: "400" },
  { label: "404 Not Found", value: "404" },
  { label: "500 Server Error", value: "500" },
];

type Props = {
  total?: number;
};

export function WebhookFilters({ total }: Props) {
  const filters = useWebhookStore((s) => s.filters);
  const setFilters = useWebhookStore((s) => s.setFilters);
  const resetFilters = useWebhookStore((s) => s.resetFilters);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    setFilters({ search: debouncedSearch.trim() });
  }, [debouncedSearch, setFilters]);

  const onReset = () => {
    resetFilters();
    setSearchInput("");
  };

  return (
    <div className="payments-toolbar app-card-flat p-4 space-y-4">
      <QuickStatusChips />
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
          <div className="min-w-[160px] sm:flex-1 xl:max-w-[180px]">
            <SelectPicker
              {...PICKER_NO_SEARCH}
              data={DATE_RANGES}
              value={filters.dateRange}
              onChange={(val) =>
                setFilters({
                  dateRange: (val as WebhookFilters["dateRange"]) || "30d",
                })
              }
              block
              cleanable={false}
            />
          </div>
          <div className="min-w-[220px] sm:flex-1 xl:max-w-[220px]">
            <SelectPicker
              {...PICKER_NO_SEARCH}
              data={EVENT_TYPE_OPTIONS}
              value={filters.eventType}
              onChange={(val) => setFilters({ eventType: String(val || "all") })}
              block
              cleanable={false}
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <InputGroup inside>
              <Input
                placeholder="Search event, entity ID, error…"
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
            data={HTTP_STATUS_OPTIONS}
            value={filters.httpStatus}
            onChange={(val) => setFilters({ httpStatus: String(val || "all") })}
            block
            cleanable={false}
          />
        </div>
        {typeof total === "number" && (
          <span className="text-sm text-app-muted sm:ml-auto self-center">
            {total} deliver{total === 1 ? "y" : "ies"}
          </span>
        )}
      </div>
    </div>
  );
}
