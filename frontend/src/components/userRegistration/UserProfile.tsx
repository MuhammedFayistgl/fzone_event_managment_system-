import { motion } from "framer-motion";
import { useAppSelector } from "../../hooks/hooks";

function UserProfile() {
    const investor = useAppSelector((s: any) => s.eventRegistor?.data || {});

    return (
        <motion.div
            key={investor?.investor?.investor?._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative app-card-raised p-5 overflow-hidden"
        >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/10 blur-3xl rounded-full" />

            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-app-text text-xl font-bold shadow-md">
                    {investor?.investor?.Name?.charAt(0)}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-app-text capitalize">
                        {investor?.investor?.Name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-app-muted">ID: {investor?.investor?.No}</span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                            Verified Investor
                        </span>
                    </div>
                </div>
            </div>

            <div className="my-3 h-px bg-app-border" />

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-app-muted text-xs">Code</p>
                    <p className="font-medium text-app-text">{investor?.investor?.Code_No}</p>
                </div>
                <div>
                    <p className="text-app-muted text-xs">Phone</p>
                    <p className="font-medium text-app-text">{investor?.investor?.Phone_No}</p>
                </div>
            </div>

            <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600"
            />
        </motion.div>
    );
}

export default UserProfile;
