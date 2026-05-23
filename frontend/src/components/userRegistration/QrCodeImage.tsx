import { motion } from "framer-motion";
import { useAppSelector } from "../../hooks/hooks";

export const QrCodeImage = () => {
  const registration = useAppSelector((s: any) => s.eventRegistor?.data?.registration || {});
  const checkedIn = registration?.isCheckedIn;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`app-card-raised p-6 ${
        checkedIn ? "border-red-500/30" : "border-emerald-500/30"
      }`}
    >
      <h3 className={`text-center font-semibold mb-3 ${checkedIn ? "text-red-400" : "text-emerald-400"}`}>
        {checkedIn ? "CHECK-IN COMPLETED" : "Entry Pass"}
      </h3>

      <div className="flex justify-center">
        <img
          src={registration?.qrCodeImage}
          alt="QR"
          className="w-40 h-40 rounded-lg shadow-md border border-app-border"
        />
      </div>

      <p className="text-center text-xs text-app-muted mt-3">Token ID</p>
      <p className="text-center font-mono text-sm text-app-text break-all">
        {registration?.qrToken}
      </p>
    </motion.div>
  );
};
