import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { usePlatformOpsMutations } from "../hooks/usePlatformOpsQueries";
import { formatBytes } from "../utils/formatOps";

type Plan = {
  _id: string;
  tier: string;
  label: string;
  description?: string;
  storageBytes: number;
  apiRequestsMonth: number;
  maxAdmins: number;
  bandwidthBytesMonth: number;
  priceMonthlyInr: number;
  priceYearlyInr: number;
  features?: string[];
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PricingCards({
  plans,
  currentPlan,
  isSuperAdmin,
  onRefresh,
}: {
  plans?: Plan[];
  currentPlan?: string;
  isSuperAdmin?: boolean;
  onRefresh: () => void;
}) {
  const { subscribe, confirmPayment } = usePlatformOpsMutations();

  const handleSubscribe = async (tier: string, billingCycle: "monthly" | "yearly") => {
    if (!isSuperAdmin) {
      toast.error("Only super admin can change platform plan");
      return;
    }
    try {
      const res = await subscribe.mutateAsync({ tier, billingCycle });
      if (tier === "free" || !res.razorpayOrderId) {
        toast.success(res.message || "Plan updated");
        onRefresh();
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        toast.error("Could not load Razorpay checkout");
        return;
      }

      const rzp = new window.Razorpay({
        key: res.razorpayKeyId,
        amount: res.amountInr * 100,
        currency: "INR",
        name: "F-Zone Platform",
        description: `${tier} plan (${billingCycle})`,
        order_id: res.razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await confirmPayment.mutateAsync({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast.success("Subscription payment confirmed");
          onRefresh();
        },
      });
      rzp.open();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Subscribe failed");
    }
  };

  return (
    <div className="pcc-pricing-grid">
      {(plans || []).map((plan) => {
        const active = plan.tier === currentPlan;
        return (
          <article
            key={plan._id}
            className={`pcc-pricing-card app-card ${active ? "pcc-pricing-card--active" : ""}`}
          >
            {active && <span className="pcc-pricing-badge">Current plan</span>}
            <h3>{plan.label}</h3>
            <p className="pcc-pricing-price">
              {plan.priceMonthlyInr > 0 ? (
                <>₹{plan.priceMonthlyInr}<span>/mo</span></>
              ) : (
                <>Free</>
              )}
            </p>
            <ul className="pcc-pricing-features">
              <li><Check size={14} /> {formatBytes(plan.storageBytes)} storage</li>
              <li><Check size={14} /> {plan.apiRequestsMonth.toLocaleString()} API / month</li>
              <li><Check size={14} /> {plan.maxAdmins} admin seats</li>
              <li><Check size={14} /> {formatBytes(plan.bandwidthBytesMonth)} bandwidth</li>
            </ul>
            <div className="pcc-pricing-actions">
              <button
                type="button"
                className="pcc-btn pcc-btn--primary"
                disabled={active || subscribe.isPending}
                onClick={() => handleSubscribe(plan.tier, "monthly")}
              >
                {plan.tier === "free" ? "Switch to Free" : "Upgrade monthly"}
              </button>
              {plan.priceYearlyInr > 0 && (
                <button
                  type="button"
                  className="pcc-btn pcc-btn--ghost"
                  disabled={active || subscribe.isPending}
                  onClick={() => handleSubscribe(plan.tier, "yearly")}
                >
                  Yearly ₹{plan.priceYearlyInr}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function BillingHistoryTable({
  invoices,
}: {
  invoices?: {
    _id: string;
    invoiceNumber: string;
    tier: string;
    amountInr: number;
    status: string;
    createdAt: string;
    paidAt?: string;
  }[];
}) {
  const { retryPayment } = usePlatformOpsMutations();

  return (
    <div className="pcc-log-panel app-card">
      <h3 className="pcc-panel-title">Billing history</h3>
      {!invoices?.length ? (
        <p className="pcc-empty">No invoices yet.</p>
      ) : (
        <table className="pcc-log-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id}>
                <td>{inv.invoiceNumber}</td>
                <td className="capitalize">{inv.tier}</td>
                <td>₹{inv.amountInr}</td>
                <td>{inv.status}</td>
                <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td>
                  {inv.status === "failed" || inv.status === "open" ? (
                    <button
                      type="button"
                      className="pcc-btn pcc-btn--ghost pcc-btn--sm"
                      onClick={() => retryPayment.mutate(inv._id)}
                    >
                      Retry
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function SubscriptionControls({
  overview,
  billing,
  isSuperAdmin,
  onRefresh,
}: {
  overview?: { autoRenew?: boolean; planStatus?: string; planExpiresAt?: string | null };
  billing?: { planStatus?: string; autoRenew?: boolean };
  isSuperAdmin?: boolean;
  onRefresh: () => void;
}) {
  const { pause, resume, cancel, toggleAutoRenew } = usePlatformOpsMutations();
  if (!isSuperAdmin) return null;

  const autoRenew = billing?.autoRenew ?? overview?.autoRenew;

  return (
    <div className="pcc-sub-controls app-card">
      <h3 className="pcc-panel-title">Subscription controls</h3>
      <p className="pcc-hint">
        Status: <strong className="capitalize">{billing?.planStatus || overview?.planStatus}</strong>
        {overview?.planExpiresAt && (
          <> · Expires {new Date(overview.planExpiresAt).toLocaleDateString()}</>
        )}
      </p>
      <div className="pcc-actions-row">
        <button type="button" className="pcc-btn pcc-btn--ghost" onClick={async () => { await pause.mutateAsync(); toast.success("Paused"); onRefresh(); }}>Pause</button>
        <button type="button" className="pcc-btn pcc-btn--ghost" onClick={async () => { await resume.mutateAsync(); toast.success("Resumed"); onRefresh(); }}>Resume</button>
        <button type="button" className="pcc-btn pcc-btn--danger" onClick={async () => { await cancel.mutateAsync(); toast.success("Cancelled"); onRefresh(); }}>Cancel</button>
        <label className="pcc-toggle-inline">
          <input
            type="checkbox"
            checked={Boolean(autoRenew)}
            onChange={async (e) => {
              await toggleAutoRenew.mutateAsync(e.target.checked);
              toast.success("Auto-renew updated");
              onRefresh();
            }}
          />
          Auto renewal
        </label>
      </div>
    </div>
  );
}
