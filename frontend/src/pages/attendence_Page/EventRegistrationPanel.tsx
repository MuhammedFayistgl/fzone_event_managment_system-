import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, Users, Wallet, BadgeCheck, UserCheck } from "lucide-react";
import { Input, InputGroup } from "rsuite";

import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { useLiveEventSync } from "../../hooks/useLiveEventSync";
import { eventRegistrationDetils_Get_ById } from "../../redux/Thunks/EventRegisrationDetilsThunk";
import { getRegistrationInvestorName } from "../../utils/getRegistrationInvestorName";
import { formatEventPricingLabel, formatCurrency } from "../../utils/pricing";
import RegistrationAttendanceWorkspace from "../../components/registration/RegistrationAttendanceWorkspace";
import RegistrationGenderStats from "../../components/registration/RegistrationGenderStats";

type Props = {
  eventId?: string;
  variant?: "compact" | "full";
};

const getInvestorName = getRegistrationInvestorName;

export default function EventRegistrationPanel({
  eventId,
  variant = "compact",
}: Props) {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const payload = useAppSelector((s: any) => s.eventRegistorData?.eventsRegistors);
  const loading = useAppSelector((s: any) => s.eventRegistorData?.loading);

  const event = payload?.data?.event;
  const registrations = payload?.data?.registrations || [];
  const statistics = payload?.data?.statistics;

  useEffect(() => {
    if (eventId) dispatch(eventRegistrationDetils_Get_ById(eventId));
  }, [dispatch, eventId]);

  useLiveEventSync({ eventId, enabled: Boolean(eventId) });

  useEffect(() => {
    setSearch("");
  }, [eventId]);

  useEffect(() => {
    const urlSearch = searchParams.get("search")?.trim();
    if (urlSearch) setSearch(urlSearch);
  }, [searchParams, eventId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter((item: any) => {
      const name = getInvestorName(item).toLowerCase();
      const phone = String(item?.phone || item?.investor?.Phone_No || "");
      return name.includes(q) || phone.includes(q);
    });
  }, [registrations, search]);

  if (!eventId) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10 text-app-muted">
        Select an event to view registrations
      </div>
    );
  }

  if (loading && !event?._id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-app-muted">
        <div className="w-12 h-12 rounded-full border-4 border-app-cyan/20 border-t-app-cyan animate-spin" />
        <p className="mt-4">Loading registration details...</p>
      </div>
    );
  }

  if (!event?._id) {
    return <div className="p-8 text-center text-app-muted">Event not found</div>;
  }

  const isCompact = variant === "compact";

  return (
    <div className="text-app-text">
      <div className={isCompact ? "p-6 border-b border-app-border" : "mb-6"}>
        {isCompact ? (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-app-cyan text-xs">{event.locationType}</span>
              <span className="px-3 py-1 rounded-full bg-app-surface border border-app-border text-app-text text-xs">
                {formatEventPricingLabel(event)}
              </span>
              {event.allowGuests && (
                <span className="px-3 py-1 rounded-full bg-fuchsia-500/20 text-app-fuchsia text-xs">Guests allowed</span>
              )}
            </div>
            <h2 className="font-black text-app-text text-2xl">{event.title}</h2>
            <p className="text-app-muted mt-2 text-sm">{event.description}</p>
            <div className="flex items-center gap-2 text-app-muted text-sm mt-3">
              <MapPin className="w-4 h-4 text-app-cyan" />
              <span>{event.location}</span>
            </div>
          </>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface-raised shadow-[var(--color-shadow-card)]">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10"
              aria-hidden
            />
            <div className="relative p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-app-cyan text-xs">{event.locationType}</span>
                <span className="px-3 py-1 rounded-full bg-app-surface border border-app-border text-app-text text-xs">
                  {formatEventPricingLabel(event)}
                </span>
                {event.allowGuests && (
                  <span className="px-3 py-1 rounded-full bg-fuchsia-500/20 text-app-fuchsia text-xs">Guests allowed</span>
                )}
              </div>
              <h2 className="font-black text-app-text text-3xl md:text-4xl">{event.title}</h2>
              <p className="text-app-muted mt-2 text-sm">{event.description}</p>
              <div className="flex items-center gap-2 text-app-muted text-sm mt-3">
                <MapPin className="w-4 h-4 text-app-cyan" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-6">
        {[
          { label: "Registrations", value: statistics?.totalRegistrations ?? 0, icon: Users, color: "from-cyan-500 to-blue-500" },
          { label: "Participants", value: statistics?.totalParticipants ?? 0, icon: UserCheck, color: "from-pink-500 to-fuchsia-500" },
          { label: "Checked in", value: statistics?.checkedInCount ?? 0, icon: BadgeCheck, color: "from-emerald-500 to-green-500" },
          { label: "Pending", value: statistics?.pendingCheckInCount ?? 0, icon: UserCheck, color: "from-amber-500 to-orange-500" },
          { label: "Revenue", value: formatCurrency(statistics?.totalRevenue ?? 0), icon: Wallet, color: "from-violet-500 to-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="app-card-flat p-4">
            <p className="text-app-secondary text-xs uppercase tracking-wide">{stat.label}</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-2xl font-black text-app-text">{stat.value}</h3>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-app-text" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-2">
        <RegistrationGenderStats breakdown={statistics?.genderBreakdown} compact />
      </div>

      <div className="px-6 pb-4">
        <InputGroup inside className="!bg-app-input !border !border-app-border !rounded-2xl">
          <Input placeholder="Search name or phone..." value={search} onChange={setSearch} className="!bg-transparent !text-app-text" />
          <InputGroup.Addon><Search size={16} className="text-app-muted" /></InputGroup.Addon>
        </InputGroup>
      </div>

      <div className="px-6 pb-6 reg-attendance-panel-body">
        <RegistrationAttendanceWorkspace
          rows={filtered}
          event={event}
          eventId={eventId}
          loading={loading}
        />
        {(statistics?.totalRevenue ?? 0) > 0 && (
          <p className="text-right text-sm text-app-muted mt-4">
            Total revenue: {formatCurrency(statistics.totalRevenue)}
          </p>
        )}
      </div>
    </div>
  );
}
