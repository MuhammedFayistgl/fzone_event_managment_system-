import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Input, Button } from "rsuite";
import toast from "react-hot-toast";
import PublicShell from "../layouts/PublicShell";
import DigitalEntryPass from "../components/userRegistration/DigitalEntryPass";
import UserRefundStatusBanner from "../components/userRegistration/UserRefundStatusBanner";
import BlockedAccessBanner from "../components/userRegistration/BlockedAccessBanner";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import { GetOneEventById, checkInvestorPaymentStatus } from "../redux/EventThunks";
import { checkInvestor } from "../redux/Thunks/EventRegistorThunk";
import { setPaymentRequirement } from "../redux/paymentSlice";
import { calculateRegistrationTotal } from "../utils/pricing";

export default function InvestorPortalPage() {
  const { eventId } = useParams();
  const dispatch = useAppDispatch();
  const event = useAppSelector((s: any) => s.event.singleEvent);
  const registrationData = useAppSelector((s: any) => s.eventRegistor?.data);
  const paidTotal = useAppSelector((s: any) => s.payment.paidTotal ?? 0);
  const grossPaidTotal = useAppSelector((s: any) => s.payment.grossPaidTotal ?? 0);
  const totalRefunded = useAppSelector((s: any) => s.payment.totalRefunded ?? 0);
  const refundStatus = useAppSelector((s: any) => s.payment.refundStatus ?? "none");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (eventId) dispatch(GetOneEventById(eventId));
  }, [dispatch, eventId]);

  const registration = registrationData?.registration;
  const investor = registrationData?.investor;
  const isBlocked = Boolean(registration?.isBlocked);
  const blockedGuests = (registration?.participants || [])
    .filter((p: any) => p?.isBlocked)
    .map((p: any) => ({ name: p.name || "Guest", reason: p.blockedReason || "" }));

  const loadPortal = useCallback(async () => {
    if (!eventId || !phone.trim()) return;
    setLoading(true);
    try {
      const investorRes = await dispatch(
        checkInvestor({ phone: phone.trim(), eventId })
      ).unwrap();

      const guestCount = investorRes?.registration?.participants?.length ?? 0;
      const paymentRes = await dispatch(
        checkInvestorPaymentStatus({ eventId, phone: phone.trim() })
      ).unwrap();

      const { total, breakdown } = calculateRegistrationTotal(event, guestCount);
      dispatch(
        setPaymentRequirement({
          requiredTotal: total,
          breakdown,
          paidTotal: Number(paymentRes?.paidTotal ?? 0),
          grossPaidTotal: Number(paymentRes?.grossPaidTotal ?? 0),
          totalRefunded: Number(paymentRes?.totalRefunded ?? 0),
          refundStatus: paymentRes?.refundStatus || "none",
          refunds: paymentRes?.refunds ?? [],
          alreadyPaid: total <= 0 || Number(paymentRes?.paidTotal ?? 0) >= total,
          successPayments: paymentRes?.successPayments ?? [],
        })
      );
      setLoaded(true);
    } catch (err: any) {
      toast.error(err || "Could not load your passes");
      setLoaded(false);
    } finally {
      setLoading(false);
    }
  }, [dispatch, event, eventId, phone]);

  return (
    <PublicShell title={event?.title ? `${event.title} — My Passes` : "Investor Portal"}>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
        <div className="app-card p-6 space-y-4">
          <h2 className="text-xl font-bold">View your entry passes</h2>
          <p className="text-sm text-app-muted">
            Enter your registered mobile number to view passes, payment status, and check-in state.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <Input
              placeholder="Mobile number"
              value={phone}
              onChange={setPhone}
              disabled={loading}
            />
            <Button appearance="primary" loading={loading} onClick={loadPortal}>
              Load passes
            </Button>
          </div>
        </div>

        {loaded && investor && (
          <>
            {(isBlocked || blockedGuests.length > 0) && (
              <BlockedAccessBanner
                investorBlocked={isBlocked}
                investorReason={registration?.blockedReason}
                blockedGuests={blockedGuests}
              />
            )}
            {refundStatus !== "none" && totalRefunded > 0 && (
              <UserRefundStatusBanner
                refundStatus={refundStatus}
                totalRefunded={totalRefunded}
                paidTotal={paidTotal}
                grossPaidTotal={grossPaidTotal}
              />
            )}
            <DigitalEntryPass event={event} />
          </>
        )}
      </div>
    </PublicShell>
  );
}
