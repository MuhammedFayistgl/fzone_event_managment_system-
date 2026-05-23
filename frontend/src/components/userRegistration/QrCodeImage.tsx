import { motion } from "framer-motion";
import { useAppSelector } from "../../hooks/hooks";


export const QrCodeImage = () => {
  const registration = useAppSelector((s: any) => s.eventRegistor?.data?.registration || {});

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`h-full bg-gradient-to-br ${registration?.isCheckedIn ? ` from-red-50 to-red-100 border border-red-200` : ` from-green-50 to-white border border-green-200`} rounded-2xl p-6 shadow-xl`}
      >
        <h3 className={`text-center font-semibold ${registration?.isCheckedIn ? ' text-red-700' : ' text-green-700'}  text-green-700 mb-3`} >
          {`  ${registration?.isCheckedIn ? `CHECK-IN COMPLETED` : 'Entry Pass'} `}
        </h3>

        {/* QR */}
        <div className="flex justify-center">
          <img
            src={registration?.qrCodeImage}
            alt="QR"
            className="w-40 h-40 rounded-lg shadow-md"
          />
        </div>

        {/* Token */}
        <p className="text-center text-xs text-gray-500 mt-3">
          Token ID
        </p>
        <p className="text-center font-mono text-sm text-gray-700 break-all">
          {registration?.qrToken}
        </p>


      </motion.div>

    </>
  )
}
