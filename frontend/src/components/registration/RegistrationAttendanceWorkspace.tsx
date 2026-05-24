import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../hooks/hooks";
import { blockRegistrationParticipant } from "../../redux/EventThunks";
import { eventRegistrationDetils_Get_ById } from "../../redux/Thunks/EventRegisrationDetilsThunk";
import RegistrationToolbar from "./RegistrationToolbar";
import RegistrationMasterTable from "./RegistrationMasterTable";
import {
  buildTicketItemsFromRegistration,
  downloadTicketPdf,
  downloadTicketsZip,
} from "../../utils/ticketExport";
import { getGuestPaymentStatuses, type EventPricingFields } from "../../utils/pricing";
import type {
  BlockFilter,
  RegistrationAttendanceRow,
} from "../../Types/registrationAttendance.types";
import type { EventResponseType } from "../../Types/event";

type Props = {
  rows: RegistrationAttendanceRow[];
  event: EventResponseType;
  eventId: string;
  loading?: boolean;
};

function rowMatchesBlockFilter(row: RegistrationAttendanceRow, filter: BlockFilter) {
  const anyBlocked =
    row.isBlocked || (row.participants || []).some((p) => p.isBlocked);
  if (filter === "blocked") return anyBlocked;
  if (filter === "active") return !anyBlocked;
  return true;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
}

export default function RegistrationAttendanceWorkspace({
  rows,
  event,
  eventId,
  loading = false,
}: Props) {
  const dispatch = useAppDispatch();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [blockFilter, setBlockFilter] = useState<BlockFilter>("all");
  const [busy, setBusy] = useState(false);

  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatchesBlockFilter(row, blockFilter)),
    [rows, blockFilter]
  );

  const refresh = useCallback(() => {
    dispatch(eventRegistrationDetils_Get_ById(eventId));
  }, [dispatch, eventId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allOn = ids.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(ids);
    });
  };

  const collectItems = (targetRows: RegistrationAttendanceRow[]) => {
    return targetRows.flatMap((row) =>
      buildTicketItemsFromRegistration(row, event as EventResponseType)
    );
  };

  const runDownload = async (
    label: string,
    targetRows: RegistrationAttendanceRow[],
    asZip: boolean
  ) => {
    const items = collectItems(targetRows);
    if (items.length === 0) {
      toast.error("No ticket QR codes available to download");
      return;
    }
    setBusy(true);
    const toastId = toast.loading(`${label}…`);
    try {
      if (asZip) {
        await downloadTicketsZip(items, `${slugify(event.title || "event")}-tickets.zip`);
      } else if (items.length === 1) {
        await downloadTicketPdf(items[0]);
      } else {
        await downloadTicketsZip(items, `${slugify(event.title || "event")}-selected.zip`);
      }
      toast.success(`${label} ready`, { id: toastId });
    } catch {
      toast.error("Download failed", { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadInvestor = async (row: RegistrationAttendanceRow) => {
    const items = buildTicketItemsFromRegistration(row, event).filter(
      (i) => i.input.passType === "investor"
    );
    if (!items.length) {
      toast.error("Investor ticket not available");
      return;
    }
    setBusy(true);
    try {
      await downloadTicketPdf(items[0]);
      toast.success("Investor ticket downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadGuest = async (row: RegistrationAttendanceRow, guestIndex: number) => {
    const guest = row.participants?.[guestIndex];
    if (!guest?.qrCodeImage) {
      toast.error("Guest ticket not available");
      return;
    }
    const items = buildTicketItemsFromRegistration(row, event).filter(
      (i) =>
        i.input.passType === "guest" &&
        i.input.guest?.name === guest.name
    );
    if (!items.length) {
      toast.error("Guest ticket not available");
      return;
    }
    setBusy(true);
    try {
      await downloadTicketPdf(items[0]);
      toast.success("Guest ticket downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = async (
    row: RegistrationAttendanceRow,
    target: "investor" | "guest",
    blocked: boolean,
    guestIndex?: number
  ) => {
    let reason = "";
    if (blocked) {
      const input = window.prompt("Block reason (optional):", "");
      if (input === null) return;
      reason = input;
    }

    try {
      await dispatch(
        blockRegistrationParticipant({
          registrationId: row._id,
          target,
          guestIndex,
          blocked,
          reason,
        })
      ).unwrap();
      toast.success(blocked ? "Entry blocked" : "Block removed");
      refresh();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Block update failed");
    }
  };

  const exportGuestCsv = () => {
    const lines = [
      "Investor,Phone,Guest Name,Gender,Guest Phone,Paid Status,Check-in,Blocked",
    ];

    filteredRows.forEach((row) => {
      const paidTotal =
        Number(row.payment?.paidTotal ?? 0) ||
        (row.payment?.status === "success" ? Number(row.payment?.amount ?? 0) : 0);
      const guestCount = row.participants?.length ?? 0;
      const statuses = getGuestPaymentStatuses(
        event as EventPricingFields,
        guestCount,
        paidTotal
      );
      const investorName = row.investor?.Name || "";

      (row.participants || []).forEach((guest, index) => {
        lines.push(
          [
            `"${investorName.replace(/"/g, '""')}"`,
            row.phone,
            `"${(guest.name || "").replace(/"/g, '""')}"`,
            guest.gender || "",
            guest.phone || "",
            statuses[index] || "",
            guest.isCheckedIn ? "yes" : "no",
            guest.isBlocked ? "yes" : "no",
          ].join(",")
        );
      });
    });

    if (lines.length <= 1) {
      toast.error("No guest rows to export");
      return;
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(event.title || "event")}-guests.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Guest CSV exported");
  };

  return (
    <div className="reg-attendance-workspace">
      <RegistrationToolbar
        selectedCount={selectedIds.size}
        totalCount={filteredRows.length}
        blockFilter={blockFilter}
        onBlockFilterChange={setBlockFilter}
        onDownloadSelected={() =>
          runDownload(
            "Downloading selected",
            filteredRows.filter((r) => selectedIds.has(r._id)),
            true
          )
        }
        onDownloadAll={() => runDownload("Downloading all tickets", filteredRows, true)}
        onExportGuestCsv={exportGuestCsv}
        busy={busy || loading}
      />

      {loading ? (
        <div className="reg-master-table__empty">Loading registrations…</div>
      ) : (
        <RegistrationMasterTable
          rows={filteredRows}
          event={event}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onDownloadInvestor={handleDownloadInvestor}
          onDownloadGuest={handleDownloadGuest}
          onDownloadRowAll={(row) => runDownload("Downloading passes", [row], true)}
          onBlockInvestor={(row, blocked) => handleBlock(row, "investor", blocked)}
          onBlockGuest={(row, index, blocked) => handleBlock(row, "guest", blocked, index)}
        />
      )}
    </div>
  );
}
