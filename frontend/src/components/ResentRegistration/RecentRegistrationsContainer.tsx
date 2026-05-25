import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import RecentRegistrationsUI from "../RecentRegistrationsUI";
import AppPageLayout from "../../layouts/AppPageLayout";
import API from "../../api/axios";
import { downloadRegistrationsCsv } from "../../utils/registrationExport";
import {
  useHighlightMatcher,
  useNotificationHighlightParam,
} from "../../hooks/useNotificationHighlight";

type Props = {
  mode?: "preview" | "full";
};

export type RegistrationRow = {
  id: string;
  eventId?: string;
  name: string;
  phone: string;
  category: string;
  passStatus: string;
  checkIn: boolean;
  time: string | Date;
  eventTitle?: string;
  guestCount?: number;
};

const PAGE_SIZE = 50;

const RecentRegistrationsContainer: React.FC<Props> = ({ mode = "preview" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  } | null>(null);
  const { highlightId } = useNotificationHighlightParam();
  const isHighlighted = useHighlightMatcher(highlightId);

  useEffect(() => {
    if (!highlightId || !rows.length || mode !== "full") return;
    const match = rows.find((row) => isHighlighted(row));
    if (!match) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`reg-row-${match.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [highlightId, rows, isHighlighted, mode]);

  useEffect(() => {
    const urlSearch = searchParams.get("search")?.trim();
    if (urlSearch && mode === "full") {
      setSearch(urlSearch);
      setPage(1);
    }
  }, [mode, searchParams]);

  const fetchRows = useCallback(() => {
    setLoading(true);
    API.post("/admin/all-registrations", {
      page,
      limit: mode === "preview" ? 8 : PAGE_SIZE,
      search: search.trim() || undefined,
    })
      .then((res) => {
        const registrations = res.data?.data?.registrations || [];
        const pg = res.data?.data?.pagination || null;
        setRows(registrations);
        setPagination(pg);
      })
      .catch(() => {
        setRows([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, [mode, page, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const filtered = useMemo(() => rows, [rows]);

  const handleExport = async () => {
    const res = await API.post("/admin/all-registrations/export", {
      search: search.trim() || undefined,
    });
    const exportRows = res.data?.data?.rows || [];
    downloadRegistrationsCsv(exportRows);
  };

  const handleView = (row: RegistrationRow) => {
    if (!row.eventId) {
      toast.error("Event not linked to this registration");
      return;
    }
    const q = row.phone ? `?search=${encodeURIComponent(row.phone)}` : "";
    navigate(`/event-attendance/${row.eventId}${q}`);
  };

  const content = (
    <RecentRegistrationsUI
      preview={mode === "preview"}
      navigate={navigate}
      filtered={filtered}
      loading={loading}
      search={search}
      setSearch={handleSearchChange}
      onExport={mode === "full" ? handleExport : undefined}
      isHighlighted={mode === "full" ? isHighlighted : undefined}
      pagination={pagination}
      page={page}
      onPageChange={setPage}
      onView={mode === "full" ? handleView : undefined}
    />
  );

  if (mode === "full") {
    return (
      <AppPageLayout title="All Registrations" embedded showGlow={false}>
        {content}
      </AppPageLayout>
    );
  }

  return content;
};

export default RecentRegistrationsContainer;
