import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { WebhookDelivery } from "../../types/webhook.types";
import { formatWhen, truncateError, truncateId } from "../../utils/formatWebhook";
import { EventTypeBadge } from "./EventTypeBadge";
import { StatusBadge } from "./StatusBadge";
import { WebhookEmptyState, WebhookSkeleton } from "../ui/primitives";
import { useWebhookStore } from "../../store/webhookStore";
import { MobileWebhookCard } from "./MobileWebhookCard";
import {
  SortableTableHeader,
  useTableSort,
} from "../../../../components/platform/SortableTableHeader";

type Props = {
  rows: WebhookDelivery[];
  loading?: boolean;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  onView: (row: WebhookDelivery) => void;
};

export function WebhookTable({ rows, loading, pagination, onView }: Props) {
  const setPagination = useWebhookStore((s) => s.setPagination);
  const sort = useWebhookStore((s) => s.sort);
  const setSort = useWebhookStore((s) => s.setSort);
  const handleSort = useTableSort(sort.sortBy, sort.sortOrder, setSort);

  const columns = useMemo<ColumnDef<WebhookDelivery>[]>(
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
        id: "eventType",
        header: () => (
          <SortableTableHeader
            label="Event"
            field="eventType"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <div>
            <EventTypeBadge label={row.original.eventTypeLabel} />
            <p className="text-xs text-app-muted mt-1">{row.original.eventType}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: () => (
          <SortableTableHeader
            label="Status"
            field="status"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "http",
        header: () => (
          <SortableTableHeader
            label="HTTP"
            field="httpStatus"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => row.original.httpStatus ?? "—",
      },
      {
        id: "entity",
        header: "Entity ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{truncateId(row.original.entityId)}</span>
        ),
      },
      {
        id: "provider",
        header: "Provider",
        cell: ({ row }) => row.original.provider,
      },
      {
        id: "error",
        header: "Error",
        cell: ({ row }) => (
          <span className="text-red-500 dark:text-red-400 text-xs">
            {truncateError(row.original.errorMessage)}
          </span>
        ),
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
            aria-label="View delivery"
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
          <WebhookSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <WebhookEmptyState
        title="No webhook deliveries found"
        description="Try adjusting filters or date range."
      />
    );
  }

  return (
    <div className="payments-ledger app-card-flat overflow-hidden">
      <div className="hidden md:block webhook-table-wrap">
        <table className="webhook-table">
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
          <MobileWebhookCard key={row._id} row={row} onView={() => onView(row)} />
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
