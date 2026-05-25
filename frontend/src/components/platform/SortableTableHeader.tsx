import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type Props = {
  label: string;
  field: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
};

export function SortableTableHeader({ label, field, sortBy, sortOrder, onSort }: Props) {
  const active = sortBy === field;

  return (
    <button
      type="button"
      className="platform-sort-th"
      onClick={() => onSort(field)}
      aria-sort={active ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      {active ? (
        sortOrder === "asc" ? (
          <ArrowUp size={12} aria-hidden />
        ) : (
          <ArrowDown size={12} aria-hidden />
        )
      ) : (
        <ArrowUpDown size={12} className="opacity-40" aria-hidden />
      )}
    </button>
  );
}

export function useTableSort(
  sortBy: string,
  sortOrder: "asc" | "desc",
  setSort: (sort: { sortBy: string; sortOrder: "asc" | "desc" }) => void
) {
  const handleSort = (field: string) => {
    setSort({
      sortBy: field,
      sortOrder: sortBy === field && sortOrder === "desc" ? "asc" : "desc",
    });
  };

  return handleSort;
}
