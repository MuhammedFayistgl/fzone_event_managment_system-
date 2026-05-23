import { motion } from "framer-motion";
import { useAppSelector } from "../../hooks/hooks";

function UserProfile() {


    const investor = useAppSelector((s: any) => s.eventRegistor?.data || {});
    const container = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <>
            <motion.div
                key={investor?.investor?.investor?._id}
                variants={container}
                initial="hidden"
                animate="show"
                className="relative bg-white/80 backdrop-blur-xl border border-green-200 rounded-2xl shadow-lg p-5 overflow-hidden"
            >

                {/* Glow Effect */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-300 opacity-20 blur-3xl rounded-full" />

                <div className="flex items-center gap-4">

                    {/* Avatar */}
                    <motion.div
                        variants={item}
                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-md"
                    >
                        {investor?.investor?.Name?.charAt(0)}
                    </motion.div>

                    {/* Name + Badge */}
                    <div className="flex-1">
                        <motion.h3
                            variants={item}
                            className="text-lg font-semibold text-gray-800 capitalize"
                        >
                            {investor?.investor?.Name}
                        </motion.h3>

                        <motion.div
                            variants={item}
                            className="flex items-center gap-2 mt-1"
                        >
                            <span className="text-xs text-gray-500">
                                ID :{investor?.investor?.No}
                            </span>

                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Verified Investor
                            </span>
                        </motion.div>
                    </div>
                </div>

                {/* Divider */}
                <motion.div
                    variants={item}
                    className="my-3 h-[1px] bg-gray-200"
                />

                {/* Details */}
                <motion.div
                    variants={container}
                    className="grid grid-cols-2 gap-3 text-sm"
                >

                    <motion.div variants={item}>
                        <p className="text-gray-400 text-xs">Code</p>
                        <p className="font-medium text-gray-700">{investor?.investor?.Code_No}</p>
                    </motion.div>

                    <motion.div variants={item}>
                        <p className="text-gray-400 text-xs">Phone</p>
                        <p className="font-medium text-gray-700">{investor?.investor?.Phone_No}</p>
                    </motion.div>

                </motion.div>

                {/* Bottom Animated Line */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-green-400 to-emerald-600"
                />

            </motion.div>

        </>
    )
}

export default UserProfile