import { useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input, InputGroup, SelectPicker } from "rsuite";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useNotificationStore } from "../store/notificationStore";
import { NotificationCategoryChips } from "./NotificationCategoryChips";

const PICKER_PROPS = {
  popupClassName: "pro-picker-menu",
  className: "pro-picker-toggle",
} as const;

const PRIORITIES = [
  { label: "All priorities", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const READ_STATUS = [
  { label: "All status", value: "all" },
  { label: "Unread", value: "false" },
  { label: "Read", value: "true" },
];

type Props = {
  total?: number;
};

export function NotificationFilters({ total }: Props) {
  const filters = useNotificationStore((s) => s.filters);
  const setFilters = useNotificationStore((s) => s.setFilters);
  const resetFilters = useNotificationStore((s) => s.resetFilters);

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
      <NotificationCategoryChips />

      <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
          <div className="min-w-[160px] sm:flex-1 xl:max-w-[180px]">
            <SelectPicker
              {...PICKER_PROPS}
              searchable={false}
              data={PRIORITIES}
              value={filters.priority}
              onChange={(val) => setFilters({ priority: String(val || "all") })}
              block
              cleanable={false}
            />
          </div>
          <div className="min-w-[160px] sm:flex-1 xl:max-w-[180px]">
            <SelectPicker
              {...PICKER_PROPS}
              searchable={false}
              data={READ_STATUS}
              value={filters.read}
              onChange={(val) =>
                setFilters({ read: (String(val || "all") as "all" | "true" | "false") })
              }
              block
              cleanable={false}
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <InputGroup inside className="!rounded-xl">
              <Input
                placeholder="Search title, message, category…"
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

      {typeof total === "number" && (
        <p className="text-sm text-app-muted">
          {total} notification{total === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
