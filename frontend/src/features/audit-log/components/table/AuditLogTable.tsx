import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { AuditLogEntry } from "../../types/auditLog.types";
import { formatWhen, truncateId } from "../../utils/formatAuditLog";
import { CategoryBadge } from "./CategoryBadge";
import { SeverityBadge } from "./SeverityBadge";
import { AuditEmptyState, AuditSkeleton } from "../ui/primitives";
import { useAuditLogStore } from "../../store/auditLogStore";
import { MobileAuditCard } from "./MobileAuditCard";
import {
  SortableTableHeader,
  useTableSort,
} from "../../../../components/platform/SortableTableHeader";

type Props = {
  rows: AuditLogEntry[];
  loading?: boolean;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  onView: (row: AuditLogEntry) => void;
};

export function AuditLogTable({ rows, loading, pagination, onView }: Props) {
  const setPagination = useAuditLogStore((s) => s.setPagination);
  const sort = useAuditLogStore((s) => s.sort);
  const setSort = useAuditLogStore((s) => s.setSort);
  const handleSort = useTableSort(sort.sortBy, sort.sortOrder, setSort);

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        id: "time",
        header: () => (
          <SortableTableHeader
            label="Time"
            field="createdAt"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatWhen(row.original.createdAt)}</span>
        ),
      },
      {
        id: "action",
        header: () => (
          <SortableTableHeader
            label="Action"
            field="action"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.actionLabel}</p>
            <p className="text-xs text-app-muted">{row.original.action}</p>
          </div>
        ),
      },
      {
        id: "category",
        header: () => (
          <SortableTableHeader
            label="Category"
            field="category"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => <CategoryBadge category={row.original.category} />,
      },
      {
        id: "actor",
        header: "Actor",
        cell: ({ row }) => (
          <div>
            <p>{row.original.actorEmail || "system"}</p>
            {row.original.actorRole && (
              <p className="text-xs text-app-muted">{row.original.actorRole}</p>
            )}
          </div>
        ),
      },
      {
        id: "event",
        header: "Event",
        cell: ({ row }) => row.original.eventTitle || "—",
      },
      {
        id: "target",
        header: "Target",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.targetType
              ? `${row.original.targetType} · ${truncateId(row.original.targetId)}`
              : "—"}
          </span>
        ),
      },
      {
        id: "severity",
        header: "Severity",
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            type="button"
            className="payments-row-action"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
            aria-label="View entry"
          >
            <Eye size={14} />
          </button>
        ),
      },
    ],
    [handleSort, onView, sort.sortBy, sort.sortOrder]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <AuditSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <AuditEmptyState
        title="No audit entries found"
        description="Try adjusting filters or date range."
      />
    );
  }

  return (
    <div className="payments-ledger app-card-flat overflow-hidden">
      <div className="hidden md:block audit-log-table-wrap">
        <table className="audit-log-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => onView(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 p-3">
        {rows.map((row) => (
          <MobileAuditCard key={row._id} row={row} onView={() => onView(row)} />
        ))}
      </div>

      {pagination && (
        <div className="payments-ledger__pagination text-sm text-app-muted">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="reg-toolbar-btn"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ page: pagination.page - 1 })}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="reg-toolbar-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination({ page: pagination.page + 1 })}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
