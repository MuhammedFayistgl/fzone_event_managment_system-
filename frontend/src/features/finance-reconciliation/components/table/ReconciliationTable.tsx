import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { ReconciliationTransaction } from "../../types/reconciliation.types";
import { formatAmount, truncateId } from "../../utils/formatReconciliation";
import { StatusBadge } from "./StatusBadge";
import { ReconButton, ReconEmptyState, ReconSkeleton } from "../ui/primitives";
import { useReconciliationStore } from "../../store/reconciliationStore";
import { MobileTransactionCard } from "./MobileTransactionCard";
import {
  SortableTableHeader,
  useTableSort,
} from "../../../../components/platform/SortableTableHeader";

type Props = {
  rows: ReconciliationTransaction[];
  loading?: boolean;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  onView: (row: ReconciliationTransaction) => void;
};

export function ReconciliationTable({ rows, loading, pagination, onView }: Props) {
  const setPagination = useReconciliationStore((s) => s.setPagination);
  const sort = useReconciliationStore((s) => s.sort);
  const setSort = useReconciliationStore((s) => s.setSort);
  const handleSort = useTableSort(sort.sortBy, sort.sortOrder, setSort);

  const columns = useMemo<ColumnDef<ReconciliationTransaction>[]>(
    () => [
      {
        accessorKey: "razorpay_payment_id",
        header: "Transaction ID",
        cell: ({ row }) =>
          truncateId(
            row.original.razorpay_payment_id ||
              row.original.razorpay_order_id ||
              row.original._id
          ),
      },
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.investorName || "—"}</p>
            <p className="text-xs text-app-muted">{row.original.phone}</p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: () => (
          <SortableTableHeader
            label="Amount"
            field="amount"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => formatAmount(row.original.amount),
      },
      {
        accessorKey: "method",
        header: () => (
          <SortableTableHeader
            label="Method"
            field="method"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
      },
      {
        accessorKey: "gateway",
        header: "Gateway",
      },
      {
        accessorKey: "settlementStatus",
        header: "Settlement",
        cell: ({ row }) => (
          <span className="capitalize text-xs">{row.original.settlementStatus}</span>
        ),
      },
      {
        accessorKey: "reconciliationStatus",
        header: "Reconciliation",
        cell: ({ row }) => (
          <StatusBadge status={row.original.reconciliationStatus} />
        ),
      },
      {
        id: "date",
        header: () => (
          <SortableTableHeader
            label="Date"
            field="createdAt"
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) =>
          new Date(row.original.paidAt || row.original.createdAt).toLocaleDateString(),
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
            aria-label="View transaction"
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
          <ReconSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <ReconEmptyState
        title="No transactions found"
        description="Try adjusting filters or date range."
      />
    );
  }

  return (
    <div className="payments-ledger app-card-flat overflow-hidden">
      <div className="hidden md:block finance-recon-table-wrap">
        <table className="finance-recon-table">
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

      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <MobileTransactionCard key={row._id} row={row} onView={() => onView(row)} />
        ))}
      </div>

      {pagination && (
        <div className="payments-ledger__pagination text-sm text-app-muted">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
            total
          </span>
          <div className="flex gap-2">
            <ReconButton
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ page: pagination.page - 1 })}
            >
              <ChevronLeft size={14} />
            </ReconButton>
            <ReconButton
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination({ page: pagination.page + 1 })}
            >
              <ChevronRight size={14} />
            </ReconButton>
          </div>
        </div>
      )}
    </div>
  );
}
