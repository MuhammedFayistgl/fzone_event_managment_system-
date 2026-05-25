// ================= EVENT REGISTER PAGE =================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input, Button } from "rsuite";
import { useParams } from "react-router";

import { useAppDispatch, useAppSelector } from "../hooks/hooks";

import {
  checkInvestorPaymentStatus,
  createPaymentOrder,
  GetOneEventById,
  verifyPayment,
} from "../redux/EventThunks";

import {
  checkInvestor,
  registerEvent,
} from "../redux/Thunks/EventRegistorThunk";

import { resetPaymentState, setPaymentRequirement } from "../redux/paymentSlice";
import { resetGuests, clearInvestor } from "../redux/EventRegister";

import toast from "react-hot-toast";

import ResterHeader from "../components/register/RegisterInfo";
import IsClosed from "../components/userRegistration/IsClosed";
import DigitalEntryPass from "../components/userRegistration/DigitalEntryPass";
import { GuestDetails } from "../components/userRegistration/GuestDetails";
import { PaymentSuccess } from "../components/userRegistration/PaymentSuccess";
import PaymentSummaryBlock from "../components/pricing/PaymentSummaryBlock";
import UserRefundStatusBanner from "../components/userRegistration/UserRefundStatusBanner";
import BlockedAccessBanner from "../components/userRegistration/BlockedAccessBanner";
import { checkIsEventClosed } from "../util/dataHelpers";
import {
  calculateRegistrationTotal,
  formatCurrency,
  getMarginalGuestCost,
  isPaymentSufficient,
  paymentRequired,
} from "../utils/pricing";

const PAYMENT_SUCCESS_KEY = "payment_success";

async function refreshWithRetry(
  fn: () => Promise<unknown>,
  attempts = 2
): Promise<unknown> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  throw lastError;
}

export default function EventRegisterPagePro() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const payLockRef = useRef(false);

  const event = useAppSelector((s: any) => s.event.singleEvent);
  const registrationData = useAppSelector((s: any) => s.eventRegistor?.data);
  const investor = registrationData?.investor || {};
  const newGuestsToSubmit = useAppSelector((s: any) => s.eventRegistor?.guests || []);
  const paidTotal = useAppSelector((s: any) => s.payment.paidTotal ?? 0);
  const grossPaidTotal = useAppSelector((s: any) => s.payment.grossPaidTotal ?? 0);
  const totalRefunded = useAppSelector((s: any) => s.payment.totalRefunded ?? 0);
  const refundStatus = useAppSelector((s: any) => s.payment.refundStatus ?? "none");
  const paymentSyncing = useAppSelector((s: any) => s.payment.syncing ?? false);
  const successPayments = useAppSelector((s: any) => s.payment.successPayments ?? []);
  const paymentLoading = useAppSelector((s: any) => s.payment.loading ?? false);
  const error = useAppSelector((s: any) => s.payment.error);

  const registration = registrationData?.registration;
  const isBlocked = Boolean(registration?.isBlocked);
  const blockedReason = registration?.blockedReason || "";
  const blockedGuests = useMemo(
    () =>
      (registration?.participants || [])
        .filter((participant: any) => participant?.isBlocked)
        .map((participant: any) => ({
          name: participant.name || "Guest",
          reason: participant.blockedReason || "",
        })),
    [registration?.participants]
  );
  const hasAccessRestriction = isBlocked || blockedGuests.length > 0;

  const [form, setForm] = useState({ phone: "" });
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const [readyToSubmit, setReadyToSubmit] = useState(false);

  const isClosed = checkIsEventClosed(event);

  const existingGuestCount =
    registrationData?.registration?.participants?.length ?? 0;

  const pendingGuestCount = useMemo(
    () =>
      newGuestsToSubmit.filter(
        (g: any) => g.name?.trim() && g.gender
      ).length,
    [newGuestsToSubmit]
  );

  const totalGuestCount = existingGuestCount + pendingGuestCount;
  const maxGuests = Number(event?.maxPerUser || 0);
  const atGuestLimit = maxGuests > 0 && totalGuestCount >= maxGuests;

  const { total: requiredTotal, breakdown } = useMemo(
    () =>
      event?._id
        ? calculateRegistrationTotal(event, totalGuestCount)
        : { total: 0, breakdown: null },
    [event, totalGuestCount]
  );

  const needsPayment = event?._id ? paymentRequired(event, totalGuestCount) : false;
  const isPaymentSuccess =
    !needsPayment || isPaymentSufficient(event, totalGuestCount, paidTotal);
  const amountDue = Math.max(0, requiredTotal - paidTotal);
  const marginalCost = getMarginalGuestCost(
    event,
    Math.max(0, totalGuestCount - 1),
    totalGuestCount
  );

  const refreshPaymentStatus = useCallback(
    async (phone: string, guestCount: number) => {
      if (!event?._id) return null;

      const paymentRes = await dispatch(
        checkInvestorPaymentStatus({
          eventId: event._id,
          phone,
        })
      ).unwrap();

      const paid = Number(paymentRes?.paidTotal ?? 0);
      const { total, breakdown: nextBreakdown } = calculateRegistrationTotal(
        event,
        guestCount
      );

      dispatch(
        setPaymentRequirement({
          requiredTotal: total,
          breakdown: nextBreakdown,
          paidTotal: paid,
          grossPaidTotal: Number(paymentRes?.grossPaidTotal ?? paid),
          totalRefunded: Number(paymentRes?.totalRefunded ?? 0),
          refundStatus: paymentRes?.refundStatus || "none",
          refunds: paymentRes?.refunds ?? [],
          alreadyPaid: total <= 0 || paid >= total,
          successPayments: paymentRes?.successPayments ?? [],
        })
      );

      return paymentRes;
    },
    [dispatch, event]
  );

  useEffect(() => {
    if (!event?._id && id) {
      dispatch(GetOneEventById(id));
    }
  }, [dispatch, id, event?._id]);

  useEffect(() => {
    if (error) toast.error(typeof error === "string" ? error : "Payment error");
  }, [error]);

  useEffect(() => {
    dispatch(
      setPaymentRequirement({
        requiredTotal,
        breakdown,
        paidTotal,
        alreadyPaid: isPaymentSuccess,
      })
    );
  }, [dispatch, requiredTotal, breakdown, paidTotal, isPaymentSuccess]);

  useEffect(() => {
    if (!readyToSubmit || form.phone.length !== 10 || !event?._id) return;

    refreshWithRetry(() => refreshPaymentStatus(form.phone, totalGuestCount)).catch(
      () => {
        toast.error("Could not refresh payment status. Please try again.");
      }
    );
  }, [readyToSubmit, form.phone, totalGuestCount, event?._id, refreshPaymentStatus]);

  useEffect(() => {
    if (!readyToSubmit || !event?._id || form.phone.length !== 10) return;

    try {
      const raw = localStorage.getItem(PAYMENT_SUCCESS_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (saved?.phone === form.phone && saved?.eventId === event._id) {
        refreshWithRetry(() =>
          refreshPaymentStatus(form.phone, totalGuestCount)
        )
          .then(() => localStorage.removeItem(PAYMENT_SUCCESS_KEY))
          .catch(() => {});
      }
    } catch {
      localStorage.removeItem(PAYMENT_SUCCESS_KEY);
    }
  }, [readyToSubmit, form.phone, event?._id, totalGuestCount, refreshPaymentStatus]);

  if (!event?._id) {
    return (
      <div className="app-page min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="app-card px-6 py-5 shadow text-app-muted font-medium">
          Loading Event...
        </div>
      </div>
    );
  }

  const handlePhoneChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 10) return;

    setForm({ phone: cleaned });
    setPhoneError("");
    setReadyToSubmit(false);

    dispatch(resetPaymentState());
    dispatch(resetGuests());

    if (cleaned.length !== 10) {
      dispatch(clearInvestor());
      return;
    }

    try {
      const investorRes = await dispatch(
        checkInvestor({ phone: cleaned, eventId: id })
      ).unwrap();

      if (!investorRes?.success) {
        setPhoneError("This number is not an investor");
        return;
      }

      setReadyToSubmit(true);

      const existingCount =
        investorRes?.registration?.participants?.length ??
        investorRes?.registration?.participantCount ??
        0;

      await refreshPaymentStatus(cleaned, existingCount);
    } catch {
      setPhoneError("Investor check failed");
    }
  };

  const syncAfterPayment = async (orderAmount?: number) => {
    if (orderAmount && orderAmount > 0) {
      dispatch(
        setPaymentRequirement({
          paidTotal: paidTotal + orderAmount,
          alreadyPaid: false,
        })
      );
    }

    await refreshWithRetry(() =>
      refreshPaymentStatus(form.phone, totalGuestCount)
    );

    localStorage.setItem(
      PAYMENT_SUCCESS_KEY,
      JSON.stringify({ phone: form.phone, eventId: event._id })
    );
    toast.success("Payment confirmed");
  };

  const handlePayment = async () => {
    if (!event?._id || !form.phone || payLockRef.current) return;

    payLockRef.current = true;

    try {
      setLoading(true);

      const res = await dispatch(
        createPaymentOrder({
          eventId: event._id,
          phone: form.phone,
          guestCount: totalGuestCount,
        })
      ).unwrap();

      if (res?.paymentRequired === false || res?.requiredTotal === 0) {
        await syncAfterPayment();
        setLoading(false);
        payLockRef.current = false;
        return;
      }

      const { order, key } = res;
      const orderAmount = Number(
        res?.orderAmount ?? (order?.amount != null ? order.amount / 100 : 0)
      );

      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: event.title,
        description: event.description,
        prefill: { contact: form.phone },
        notes: { phone: form.phone, guestCount: String(totalGuestCount) },
        handler: async (response: any) => {
          try {
            const result = await dispatch(
              verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            ).unwrap();

            if (result?.success) {
              const verifiedAmount = Number(result?.amount ?? orderAmount);
              await syncAfterPayment(verifiedAmount);
            }
          } catch (err: any) {
            const payload = typeof err === "object" && err !== null ? err : { message: String(err) };
            if (payload?.paidTotal !== undefined || payload?.success) {
              await syncAfterPayment(Number(payload?.amount ?? orderAmount));
            } else {
              toast.error(payload?.message || "Payment verification failed");
            }
          } finally {
            setLoading(false);
            payLockRef.current = false;
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            payLockRef.current = false;
          },
        },
        theme: { color: "#16a34a" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed");
        setLoading(false);
        payLockRef.current = false;
      });
      rzp.open();
    } catch (err: any) {
      const payload = typeof err === "object" && err !== null ? err : { message: String(err) };
      if (payload?.paidTotal !== undefined) {
        dispatch(
          setPaymentRequirement({
            paidTotal: Number(payload.paidTotal),
            alreadyPaid: true,
          })
        );
        await refreshPaymentStatus(form.phone, totalGuestCount).catch(() => {});
        toast.success("Payment already recorded");
      } else {
        toast.error(payload?.message || "Payment could not be started");
      }
      setLoading(false);
      payLockRef.current = false;
    }
  };

  const handleRegister = async () => {
    const payloadGuests = newGuestsToSubmit.map((g: any) => ({
      name: g.name?.trim(),
      phone: g.phone || "",
      category: g.relation || "other",
      relation: g.relation || "other",
      gender: g.gender,
    }));

    const invalidGuest = payloadGuests.some(
      (g: any) => !g.name || !g.gender || (g.phone && g.phone.length !== 10)
    );

    if (invalidGuest) {
      toast.error(
        "Each guest needs a name and gender (phone optional, 10 digits if provided)"
      );
      return;
    }

    const toastId = toast.loading("Registering...");

    try {
      const res = await dispatch(
        registerEvent({
          phone: form.phone,
          eventId: event._id,
          guests: payloadGuests,
        })
      ).unwrap();

      await dispatch(checkInvestor({ phone: form.phone, eventId: id })).unwrap();
      await refreshPaymentStatus(form.phone, existingGuestCount + payloadGuests.length);

      toast.success(res?.message || "Registration successful", { id: toastId });
    } catch (err: any) {
      toast.error(err || "Registration failed", { id: toastId });
    }
  };

  const showPaymentRequired =
    needsPayment &&
    !isPaymentSuccess &&
    amountDue > 0 &&
    !isClosed &&
    readyToSubmit &&
    !isBlocked;

  const showPaymentSuccess =
    needsPayment &&
    isPaymentSuccess &&
    !isClosed &&
    readyToSubmit &&
    !(atGuestLimit && isPaymentSuccess) &&
    !isBlocked;

  const payDisabled =
    !readyToSubmit ||
    amountDue <= 0 ||
    loading ||
    paymentLoading ||
    paymentSyncing ||
    isBlocked;

  return (
    <div className="relative min-h-[calc(100vh-56px)] py-8 px-3 flex justify-center event-register-page">
      <div className="w-full max-w-5xl space-y-4">
        <ResterHeader event={event} />

        {isClosed && <IsClosed />}

        {!isClosed && (
          <div className="app-card p-6 space-y-5">
            <h2 className="text-xl font-bold text-app-text">Book Your Seat</h2>

            <div className="max-w-xl">
              <label className="text-sm font-medium text-app-muted mb-2 block">
                Mobile Number
              </label>
              <Input
                placeholder="Enter your mobile number"
                value={form.phone}
                onChange={handlePhoneChange}
                className="h-12"
              />
            </div>

            {phoneError ? (
              <div className="text-sm text-red-500 font-medium">{phoneError}</div>
            ) : null}

            {readyToSubmit && investor && (
              <DigitalEntryPass event={event} />
            )}
          </div>
        )}

        {readyToSubmit && hasAccessRestriction && (
          <BlockedAccessBanner
            investorBlocked={isBlocked}
            investorReason={blockedReason}
            blockedGuests={blockedGuests}
          />
        )}

        {readyToSubmit && refundStatus !== "none" && totalRefunded > 0 && (
          <UserRefundStatusBanner
            refundStatus={refundStatus}
            totalRefunded={totalRefunded}
            paidTotal={paidTotal}
            grossPaidTotal={grossPaidTotal}
          />
        )}

        {event?.allowGuests && !isClosed && readyToSubmit && !isBlocked && (
          <GuestDetails
            onPaymentRefresh={() =>
              refreshPaymentStatus(form.phone, totalGuestCount).catch(() => {
                toast.error("Could not refresh payment status");
              })
            }
          />
        )}

        {paymentSyncing && readyToSubmit && needsPayment && (
          <div className="app-card p-4 text-sm text-app-muted flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
            Confirming payment status…
          </div>
        )}

        {showPaymentRequired && (
          <div className="app-card p-6 border-orange-300/50 space-y-4">
            <h2 className="text-lg font-bold">Payment Required</h2>

            {marginalCost > 0 && marginalCost < amountDue && (
              <p className="text-sm text-app-secondary">
                Adding {pendingGuestCount > 0 ? "new guest(s)" : "guests"} —{" "}
                {formatCurrency(marginalCost)} this step
              </p>
            )}
            <p className="text-sm font-semibold text-app-text">
              Total due — {formatCurrency(amountDue)}
            </p>

            <PaymentSummaryBlock
              breakdown={breakdown}
              event={event}
              paidTotal={paidTotal}
              totalRefunded={totalRefunded}
              requiredTotal={requiredTotal}
            />

            <Button
              appearance="primary"
              color="red"
              block
              loading={loading || paymentLoading}
              disabled={payDisabled}
              onClick={handlePayment}
            >
              Pay {formatCurrency(amountDue)}
            </Button>
          </div>
        )}

        {showPaymentSuccess && (
          <PaymentSuccess
            paidTotal={paidTotal}
            totalRefunded={totalRefunded}
            refundStatus={refundStatus}
            requiredTotal={requiredTotal}
            breakdown={breakdown}
            successPayments={successPayments}
            syncing={paymentSyncing}
          />
        )}

        {!isClosed && (
          <div className="app-card-raised p-6 border border-app-border-strong">
            <h2 className="text-lg font-bold text-app-text">Confirm Booking</h2>
            <p className="text-sm text-app-secondary mt-1 mb-4">
              Please verify all details before submitting
            </p>

            <Button
              block
              loading={loading}
              onClick={handleRegister}
              disabled={
                !readyToSubmit ||
                loading ||
                isClosed ||
                isBlocked ||
                (needsPayment && !isPaymentSuccess)
              }
            >
              Register & Enter Meeting Portal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
