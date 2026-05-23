import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Input, InputGroup } from "rsuite";
import { Search, ArrowLeft, Users, UserCheck, X } from "lucide-react";
import { useAppSelector } from "../../hooks/hooks";
import { useDispatch } from "react-redux";
import { eventRegistrationDetils_Get_ById } from "../../redux/Thunks/EventRegisrationDetilsThunk";
import AppPageLayout from "../../layouts/AppPageLayout";
import { getRegistrationInvestorName } from "../../utils/getRegistrationInvestorName";
import RegistrationDataTable, {
    REGISTRATION_TABLE_LAYOUTS,
} from "../registration/RegistrationDataTable";

const EventStatCard = ({
    label,
    value,
    icon: Icon,
    variant,
    delay,
}: {
    label: string;
    value: number;
    icon: typeof Users;
    variant: "registrations" | "checked-in";
    delay: number;
}) => (
    <div
        className={`pro-stat-card registration-stat-card pro-stat-card--${variant} pro-animate-in`}
        style={{ ["--pro-delay" as string]: `${delay}ms` }}
    >
        <div className="pro-stat-card__icon-wrap" aria-hidden>
            <Icon size={16} />
        </div>
        <div className="pro-stat-card__body">
            <p className="pro-stat-card__label">{label}</p>
            <p className="pro-stat-card__value tabular-nums">{value.toLocaleString()}</p>
        </div>
        <span className="pro-stat-card__glow" aria-hidden />
    </div>
);

const EventCardDashbordDetils = () => {
    const dispatch = useDispatch();
    const isDark = useAppSelector((s) => s.theme.mode) === "dark";
    const event = useAppSelector((e: any) => e.eventRegistorData?.eventsRegistors?.data?.event);
    const registrations = useAppSelector((e: any) => e.eventRegistorData?.eventsRegistors?.data?.registrations);
    const statistics = useAppSelector((e: any) => e.eventRegistorData?.eventsRegistors?.data?.statistics);
    const { id } = useParams();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (id) dispatch(eventRegistrationDetils_Get_ById(id) as any);
    }, [dispatch, id]);

    const filtered =
        registrations?.filter((r: any) => {
            const q = search.toLowerCase();
            return (
                getRegistrationInvestorName(r).toLowerCase().includes(q) ||
                String(r.phone || "").includes(q)
            );
        }) ?? [];

    if (!event?._id) {
        return (
            <AppPageLayout embedded showGlow={false}>
                <div className="p-6 text-app-muted">Event not found</div>
            </AppPageLayout>
        );
    }

    return (
        <AppPageLayout embedded showGlow={false}>
            <div
                className={`registration-page-shell pro-page-stack${isDark ? " registration-page-shell--dark" : ""}`}
            >
                <div className="pro-hero-row flex flex-col gap-5 sm:flex-row sm:justify-between sm:items-start">
                    <div className="pro-animate-in" style={{ ["--pro-delay" as string]: "0ms" }}>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="pro-back-btn flex items-center gap-2 text-sm text-app-accent mb-3"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <p className="registration-page-eyebrow pro-eyebrow-pulse">Running Event</p>
                        <h1 className="registration-page-title">{event.title}</h1>
                        {event.description && (
                            <p className="registration-page-subtitle">{event.description}</p>
                        )}
                    </div>

                    <div className="pro-stat-grid registration-stat-grid grid grid-cols-2 gap-3 sm:gap-4 shrink-0 sm:w-[min(100%,20rem)]">
                        <EventStatCard
                            label="Registrations"
                            value={statistics?.totalRegistrations ?? 0}
                            icon={Users}
                            variant="registrations"
                            delay={120}
                        />
                        <EventStatCard
                            label="Checked in"
                            value={statistics?.checkedInCount ?? 0}
                            icon={UserCheck}
                            variant="checked-in"
                            delay={200}
                        />
                    </div>
                </div>

                <div
                    className="pro-controls-panel pro-animate-in"
                    style={{ ["--pro-delay" as string]: "280ms" }}
                >
                    <div className="pro-controls-panel__header">
                        <div className="pro-controls-panel__title">
                            <Search size={16} className="pro-controls-panel__title-icon" aria-hidden />
                            <span>Quick Search</span>
                        </div>
                        <div className="pro-controls-panel__meta">
                            {search.trim() ? (
                                <span className="pro-search-meta">
                                    {filtered.length} match{filtered.length === 1 ? "" : "es"}
                                </span>
                            ) : (
                                <span className="pro-search-hint">Name · Phone</span>
                            )}
                        </div>
                    </div>

                    <div className="pro-search-field">
                        <InputGroup inside className="pro-search-input">
                            <Input
                                placeholder="Search name or phone..."
                                value={search}
                                onChange={(v) => setSearch(v)}
                            />
                            <InputGroup.Addon className="pro-search-addon">
                                {search ? (
                                    <button
                                        type="button"
                                        className="pro-search-clear"
                                        onClick={() => setSearch("")}
                                        aria-label="Clear search"
                                    >
                                        <X size={15} />
                                    </button>
                                ) : (
                                    <Search size={16} />
                                )}
                            </InputGroup.Addon>
                        </InputGroup>
                    </div>
                </div>

                <div
                    className="pro-animate-in"
                    style={{ ["--pro-delay" as string]: "420ms" }}
                >
                    <RegistrationDataTable
                        rows={filtered}
                        columns={[...REGISTRATION_TABLE_LAYOUTS.eventDetail]}
                        event={event}
                    />
                </div>
            </div>
        </AppPageLayout>
    );
};

export default EventCardDashbordDetils;
