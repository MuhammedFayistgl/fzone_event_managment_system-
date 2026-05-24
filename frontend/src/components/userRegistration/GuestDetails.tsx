import { UserPlus, Users, Trash2, Phone, UserRound, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { Input, Message, toaster } from "rsuite";
import { addGuest, removeGuest, updateGuest } from "../../redux/EventRegister";
import { deleteRegisteredGuest } from "../../redux/Thunks/EventRegistorThunk";
import GenderBadge, {
  GENDER_OPTIONS,
  suggestGenderForRelation,
} from "../common/GenderBadge";
import PaymentSummaryBlock from "../pricing/PaymentSummaryBlock";
import {
  calculateRegistrationTotal,
  formatCurrency,
  getGuestAccessStatuses,
  getGuestPaymentStatuses,
  isPaymentSufficient,
  paymentRequired,
  type GuestAccessStatus,
  type GuestPaymentStatus,
} from "../../utils/pricing";

const RELATION_OPTIONS = [
  { value: "wife", label: "Wife" },
  { value: "child", label: "Child" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

function GuestPayBadge({ status }: { status: GuestPaymentStatus }) {
  const labels: Record<GuestPaymentStatus, string> = {
    free: "Free",
    paid: "Paid",
    due: "Due",
  };
  return (
    <span className={`guest-pay-badge guest-pay-badge--${status}`}>
      {labels[status]}
    </span>
  );
}

function GuestAccessBadge({ status }: { status: GuestAccessStatus }) {
  const labels: Record<GuestAccessStatus, string> = {
    allowed: "Allowed",
    blocked: "Blocked",
    free: "Free",
    paid: "Paid",
    due: "Due",
  };

  return (
    <span className={`guest-pay-badge guest-pay-badge--${status}`}>
      {labels[status]}
    </span>
  );
}

type Props = {
  onPaymentRefresh?: () => void;
};

export const GuestDetails = ({ onPaymentRefresh }: Props) => {
  const dispatch = useAppDispatch();
  const event = useAppSelector((s: any) => s.event.singleEvent);
  const guests = useAppSelector((s: any) => s.eventRegistor?.guests || []);
  const investorData = useAppSelector((s: any) => s.eventRegistor?.data || {});
  const paidTotal = useAppSelector((s: any) => s.payment.paidTotal ?? 0);
  const totalRefunded = useAppSelector((s: any) => s.payment.totalRefunded ?? 0);

  const registeredParticipants =
    investorData?.registration?.participants || [];

  const maxGuests = Number(event?.maxPerUser || 0);
  const alreadyRegisteredGuests = registeredParticipants.length;

  const pendingValidGuestCount = useMemo(
    () => guests.filter((g: any) => g.name?.trim() && g.gender).length,
    [guests]
  );

  const totalGuestsCount = alreadyRegisteredGuests + guests.length;
  const billingGuestCount = alreadyRegisteredGuests + pendingValidGuestCount;
  const slotsRemaining = Math.max(0, maxGuests - totalGuestsCount);
  const atLimit = maxGuests > 0 && totalGuestsCount >= maxGuests;

  const { total: requiredTotal, breakdown } = useMemo(
    () => calculateRegistrationTotal(event, billingGuestCount),
    [event, billingGuestCount]
  );

  const guestPayStatuses = useMemo(
    () => getGuestPaymentStatuses(event, billingGuestCount, paidTotal),
    [event, billingGuestCount, paidTotal]
  );

  const guestAccessStatuses = useMemo(
    () =>
      getGuestAccessStatuses(
        event,
        billingGuestCount,
        paidTotal,
        registeredParticipants
      ),
    [event, billingGuestCount, paidTotal, registeredParticipants]
  );

  const isFullyPaid = isPaymentSufficient(event, billingGuestCount, paidTotal);
  const amountDue = Math.max(0, requiredTotal - paidTotal);
  const hasCredit = paidTotal > requiredTotal && requiredTotal >= 0;
  const creditAmount = Math.max(0, paidTotal - requiredTotal);
  const showCostPreview = paymentRequired(event, billingGuestCount);

  if (!event?.allowGuests) return null;

  const handleAddGuest = () => {
    if (atLimit) {
      toaster.push(
        <Message type="warning" closable>
          Maximum {maxGuests} guest{maxGuests === 1 ? "" : "s"} allowed for this event
        </Message>,
        { duration: 3000 }
      );
      return;
    }

    dispatch(addGuest());
  };

  const handleUpdateGuest = (index: number, key: string, value: string) => {
    dispatch(updateGuest({ index, key: key as any, value }));
  };

  const handleRelationChange = (index: number, relation: string) => {
    handleUpdateGuest(index, "relation", relation);
    const suggested = suggestGenderForRelation(relation);
    if (suggested) {
      handleUpdateGuest(index, "gender", suggested);
    }
  };

  const handleRemoveGuest = (index: number) => {
    dispatch(removeGuest(index));
  };

  const handleDeleteRegisteredGuest = async (index: number) => {
    try {
      const registrationId = investorData?.registration?._id;
      if (!registrationId) return;

      const phone =
        investorData?.registration?.phone ||
        String(investorData?.investor?.Phone_No ?? "");

      await dispatch(
        deleteRegisteredGuest({ registrationId, guestIndex: index, phone })
      ).unwrap();

      onPaymentRefresh?.();

      toaster.push(
        <Message type="success" closable>
          Guest removed successfully
        </Message>,
        { duration: 3000 }
      );
    } catch (err: any) {
      toaster.push(
        <Message type="error" closable>
          {err || "Delete failed"}
        </Message>,
        { duration: 3000 }
      );
    }
  };

  const slotPercent = maxGuests > 0 ? Math.min(100, (totalGuestsCount / maxGuests) * 100) : 0;

  let validPendingIndex = 0;

  return (
    <section className="event-register-guests app-card p-6 space-y-5">
      <header className="event-register-guests__head">
        <div className="event-register-guests__title-wrap">
          <div className="event-register-guests__icon">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-text">Guest Details</h2>
            <p className="text-sm text-app-muted mt-0.5">
              Add companions — each guest gets their own QR pass after registration
            </p>
          </div>
        </div>
        <button
          type="button"
          className="event-register-guests__add-btn"
          onClick={handleAddGuest}
          disabled={atLimit || maxGuests === 0}
        >
          <UserPlus size={16} />
          Add Guest
        </button>
      </header>

      <div className="event-register-guests__quota">
        <div className="flex justify-between text-xs font-semibold text-app-muted mb-1.5">
          <span>
            {totalGuestsCount} / {maxGuests} slots used
          </span>
          <span>{slotsRemaining} remaining</span>
        </div>
        <div className="event-register-guests__quota-bar">
          <div
            className="event-register-guests__quota-fill"
            style={{ width: `${slotPercent}%` }}
          />
        </div>
      </div>

      {atLimit && isFullyPaid && (
        <div className="guest-limit-banner guest-limit-banner--success">
          All guest slots filled — fees covered. You can register now.
        </div>
      )}

      {atLimit && !isFullyPaid && amountDue > 0 && (
        <div className="guest-limit-banner guest-limit-banner--warning">
          All slots used — pay remaining {formatCurrency(amountDue)} to register.
        </div>
      )}

      {hasCredit && creditAmount > 0 && (
        <div className="guest-limit-banner guest-limit-banner--info">
          You have {formatCurrency(creditAmount)} credit from earlier payments. Adding guests
          will use it automatically.
        </div>
      )}

      {showCostPreview && (
        <PaymentSummaryBlock
          breakdown={breakdown}
          event={event}
          paidTotal={paidTotal}
          totalRefunded={totalRefunded}
          requiredTotal={requiredTotal}
          variant="compact"
          showTotalDue
        />
      )}

      {registeredParticipants.length > 0 && (
        <div className="space-y-3">
          <h3 className="event-register-guests__section-label">
            <CheckCircle2 size={14} />
            Registered guests
          </h3>
          {registeredParticipants.map((p: any, index: number) => (
            <article key={p._id || `${p.name}-${index}`} className="event-register-guests__saved">
              <div className="event-register-guests__saved-avatar">
                <UserRound size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-app-text truncate">{p.name}</p>
                <p className="text-xs text-app-muted capitalize mt-0.5">{p.type || "guest"}</p>
              </div>
              <GenderBadge gender={p.gender} />
              {guestAccessStatuses[index] && (
                <GuestAccessBadge status={guestAccessStatuses[index]} />
              )}
              <span className="event-register-guests__saved-badge">Saved</span>
              <button
                type="button"
                className="event-register-guests__remove-btn"
                onClick={() => handleDeleteRegisteredGuest(index)}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))}
        </div>
      )}

      {guests.length > 0 ? (
        <div className="space-y-3">
          <h3 className="event-register-guests__section-label">
            <UserPlus size={14} />
            New guests to add
          </h3>
          {guests.map((g: any, i: number) => {
            const isValid = Boolean(g.name?.trim() && g.gender);
            const statusIndex = isValid
              ? alreadyRegisteredGuests + validPendingIndex++
              : -1;
            const payStatus =
              statusIndex >= 0 ? guestPayStatuses[statusIndex] : undefined;

            return (
              <article key={g.id || i} className="event-register-guests__form-card">
                <div className="event-register-guests__form-head">
                  <span className="event-register-guests__form-badge">Guest {i + 1}</span>
                  <div className="flex items-center gap-2">
                    {payStatus && <GuestPayBadge status={payStatus} />}
                    <button
                      type="button"
                      className="event-register-guests__remove-btn"
                      onClick={() => handleRemoveGuest(i)}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="event-register-guests__form-grid">
                  <div>
                    <label className="event-register-guests__field-label">Full name</label>
                    <Input
                      placeholder="Guest name"
                      value={g.name}
                      onChange={(v) => handleUpdateGuest(i, "name", v)}
                    />
                  </div>
                  <div>
                    <label className="event-register-guests__field-label">
                      <Phone size={12} className="inline mr-1" />
                      Phone (optional)
                    </label>
                    <Input
                      placeholder="10-digit mobile"
                      value={g.phone || ""}
                      onChange={(v) => {
                        const cleaned = String(v).replace(/\D/g, "").slice(0, 10);
                        handleUpdateGuest(i, "phone", cleaned);
                      }}
                    />
                  </div>
                  <div>
                    <label className="event-register-guests__field-label">Relation</label>
                    <select
                      className="event-register-guests__select"
                      value={g.relation}
                      onChange={(e) => handleRelationChange(i, e.target.value)}
                    >
                      {RELATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="event-register-guests__field-label">Gender</label>
                    <select
                      className="event-register-guests__select"
                      value={g.gender || ""}
                      onChange={(e) => handleUpdateGuest(i, "gender", e.target.value)}
                    >
                      <option value="" disabled>
                        Select gender
                      </option>
                      {GENDER_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : registeredParticipants.length === 0 ? (
        <div className="event-register-guests__empty">
          <Users size={28} className="text-app-muted opacity-50" />
          <p className="text-sm font-semibold text-app-text mt-2">No guests added yet</p>
          <p className="text-xs text-app-muted mt-1">
            You can add up to {maxGuests} guest{maxGuests === 1 ? "" : "s"} for this event
          </p>
        </div>
      ) : null}
    </section>
  );
};
