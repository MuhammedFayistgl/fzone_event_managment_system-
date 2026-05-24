import { useEffect, useState } from "react";
import AppPageLayout from "../../layouts/AppPageLayout";
import API from "../../api/axios";
import { formatCurrency } from "../../utils/pricing";

type Reconciliation = {
  ledgerGross: number;
  ledgerNet: number;
  ledgerRefunded: number;
  pendingRefunds: number;
  razorpayCapturedSample: number | null;
  paymentCount: number;
  note?: string;
};

export default function FinanceReconciliationPage() {
  const [data, setData] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/platform/reconciliation")
      .then((res) => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppPageLayout
      title="Finance Reconciliation"
      subtitle="Compare ledger totals with Razorpay captured payments sample."
      embedded
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-sm text-app-muted">Loading reconciliation…</p>
        ) : !data ? (
          <p className="text-sm text-app-muted">Could not load reconciliation data.</p>
        ) : (
          <>
            <div className="app-card p-5">
              <p className="text-sm text-app-muted">Ledger gross</p>
              <p className="text-2xl font-bold">{formatCurrency(data.ledgerGross)}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm text-app-muted">Ledger net</p>
              <p className="text-2xl font-bold">{formatCurrency(data.ledgerNet)}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm text-app-muted">Processed refunds</p>
              <p className="text-2xl font-bold">{formatCurrency(data.ledgerRefunded)}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm text-app-muted">Pending refunds (access impact)</p>
              <p className="text-2xl font-bold">{formatCurrency(data.pendingRefunds)}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm text-app-muted">Razorpay captured (sample)</p>
              <p className="text-2xl font-bold">
                {data.razorpayCapturedSample != null
                  ? formatCurrency(data.razorpayCapturedSample)
                  : "N/A"}
              </p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm text-app-muted">Payments in ledger</p>
              <p className="text-2xl font-bold">{data.paymentCount.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>
      {data?.note && <p className="text-xs text-app-muted mt-4">{data.note}</p>}
    </AppPageLayout>
  );
}
