import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

type RegistrationRow = {
  id: string;
  name: string;
  phone: string;
  category: string;
  passStatus: string;
  checkIn: boolean;
  time: string | Date;
  eventTitle?: string;
};

const RecentRegistrationsContainer: React.FC<Props> = ({ mode = "preview" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RegistrationRow[]>([]);
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
    }
  }, [mode, searchParams]);

  useEffect(() => {
    setLoading(true);
    API.post("/admin/all-registrations", {
      page: 1,
      limit: mode === "preview" ? 8 : 100,
      search: search.trim() || undefined,
    })
      .then((res) => setRows(res.data?.data?.registrations || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [mode, search]);

  const filtered = useMemo(() => rows, [rows]);

  const handleExport = async () => {
    const res = await API.post("/admin/all-registrations/export", {
      search: search.trim() || undefined,
    });
    const exportRows = res.data?.data?.rows || [];
    downloadRegistrationsCsv(exportRows);
  };

  const content = (
    <RecentRegistrationsUI
      preview={mode === "preview"}
      navigate={navigate}
      filtered={filtered}
      loading={loading}
      search={search}
      setSearch={setSearch}
      onExport={mode === "full" ? handleExport : undefined}
      isHighlighted={mode === "full" ? isHighlighted : undefined}
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
