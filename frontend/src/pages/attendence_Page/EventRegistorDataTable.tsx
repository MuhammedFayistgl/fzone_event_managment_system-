// import { motion } from "framer-motion";
// import { UserCheck } from "lucide-react";
// import { useEffect } from "react";
// import { useDispatch } from "react-redux";
// import { eventRegistrationDetils_Get_ById } from "../../redux/Thunks/EventRegisrationDetilsThunk";

// function EventRegistorDataTable({ selectID }: any) {
//     const dispatch = useDispatch()


//     const attendees = [
//         {
//             id: 1,
//             name: "Muhammed Fayis",
//             email: "fayis@gmail.com",
//             phone: "+91 9876543210",
//             status: "Confirmed",
//         },
//         {
//             id: 2,
//             name: "Ameen",
//             email: "ameen@gmail.com",
//             phone: "+91 9999999999",
//             status: "Pending",
//         },
//         {
//             id: 3,
//             name: "Shamil",
//             email: "shamil@gmail.com",
//             phone: "+91 8888888888",
//             status: "Confirmed",
//         },
//     ];

//     return (
//         <>
//             <div className="space-y-4">
//                 {attendees.map((user, index) => (
//                     <motion.div
//                         key={user.id}
//                         initial={{ opacity: 0, x: 15 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: index * 0.08 }}
//                         className="rounded-2xl border border-app-border bg-black/20 p-5 hover:border-cyan-500/40 transition"
//                     >
//                         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//                             <div className="flex items-center gap-4">
//                                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center text-xl font-bold">
//                                     {user.name.charAt(0)}
//                                 </div>

//                                 <div>
//                                     <h4 className="text-lg font-bold">
//                                         {user.name}
//                                     </h4>

//                                     <p className="text-app-secondary text-sm">
//                                         {user.email}
//                                     </p>

//                                     <p className="text-gray-500 text-sm mt-1">
//                                         {user.phone}
//                                     </p>
//                                 </div>
//                             </div>

//                             <div
//                                 className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${user.status === "Confirmed"
//                                     ? "bg-emerald-500/20 text-emerald-200"
//                                     : "bg-yellow-500/20 text-yellow-200"
//                                     }`}
//                             >
//                                 <UserCheck className="w-4 h-4" />
//                                 {user.status}
//                             </div>
//                         </div>
//                     </motion.div>
//                 ))}
//             </div>


//         </>
//     )
// }

// export default EventRegistorDataTable




import { motion } from "framer-motion";
import { Search, ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { Input, InputGroup } from "rsuite";
import clsx from "clsx";

import { useAppSelector } from "../../hooks/hooks";
import { eventRegistrationDetils_Get_ById } from "../../redux/Thunks/EventRegisrationDetilsThunk";
import RegistrationDataTable, {
    REGISTRATION_TABLE_LAYOUTS,
} from "../../components/registration/RegistrationDataTable";
import { formatEventPricingLabel, formatCurrency } from "../../utils/pricing";
import { getRegistrationInvestorName } from "../../utils/getRegistrationInvestorName";

function EventRegistorDataTable({ selectID }: any) {
    const dispatch = useDispatch<any>();

    const navigate = useNavigate();

    const [search, setSearch] = useState("");

    // ================= REDUX STATE =================
    const registrationData = useAppSelector(
        (state: any) => state.eventRegistorData?.eventsRegistors?.data
    );

    const loading = useAppSelector(
        (state: any) => state.eventRegistorData?.loading
    );

    // ================= API CALL =================
    useEffect(() => {
        if (selectID) {
            dispatch(
                eventRegistrationDetils_Get_ById({
                    id: selectID,
                })
            );
        }
    }, [dispatch, selectID]);

    // ================= REGISTRATION =================
    const event = registrationData?.event || {};

    const statistics = registrationData?.statistics || {};

    // ================= PARTICIPANTS =================
    const attendees = useMemo(() => {
        const value = search.toLowerCase();
        return (
            registrationData?.registrations?.filter((item: any) => {
                const name = getRegistrationInvestorName(item).toLowerCase();
                return name.includes(value) || String(item?.phone || "").includes(value);
            }) || []
        );
    }, [registrationData?.registrations, search]);

    const pricingLabel = formatEventPricingLabel(event);
    const totalRevenue = Number(statistics?.totalRevenue ?? 0);

    return (
        <div className="app-page text-app-text">
            {/* ================= HEADER ================= */}
            <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="
                            mb-4 flex items-center gap-2 text-sm
                            text-cyan-400 hover:text-cyan-300
                            transition-all duration-300
                        "
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="
                            text-3xl lg:text-4xl
                            font-black tracking-tight
                            bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-500
                            bg-clip-text text-transparent
                        "
                    >
                        {event?.title || "Event Registration"}
                    </motion.h1>

                    <p className="text-app-secondary mt-2 max-w-2xl">
                        {event?.description ||
                            "Registration details and participant management"}
                    </p>
                </div>

                {/* ================= STATS ================= */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                        className="
                            rounded-2xl border border-app-border
                            bg-app-surface backdrop-blur-xl
                            px-5 py-4
                        "
                    >
                        <p className="text-app-secondary text-xs uppercase tracking-wider">
                            Participants
                        </p>

                        <h2 className="text-2xl font-black mt-1">
                            {statistics?.totalRegistrations || 0}
                        </h2>
                    </div>

                    <div
                        className="
                            rounded-2xl border border-app-border
                            bg-app-surface backdrop-blur-xl
                            px-5 py-4
                        "
                    >
                        <p className="text-app-secondary text-xs uppercase tracking-wider">
                            Pricing
                        </p>

                        <h2 className="text-sm font-bold mt-1 text-app-text">
                            {pricingLabel}
                        </h2>
                    </div>

                    <div
                        className="
                            rounded-2xl border border-app-border
                            bg-app-surface backdrop-blur-xl
                            px-5 py-4 col-span-2 lg:col-span-1
                        "
                    >
                        <p className="text-app-secondary text-xs uppercase tracking-wider">
                            Revenue
                        </p>

                        <h2
                            className={clsx(
                                "text-lg font-bold mt-1",
                                totalRevenue > 0 ? "text-emerald-400" : "text-app-muted"
                            )}
                        >
                            {formatCurrency(totalRevenue)}
                        </h2>
                    </div>
                </div>
            </div>

            {/* ================= SEARCH ================= */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                    mb-8 rounded-3xl
                    border border-app-border
                    bg-app-surface backdrop-blur-2xl
                    p-4
                "
            >
                <InputGroup inside className="!bg-transparent">
                    <InputGroup.Addon>
                        <Search size={18} />
                    </InputGroup.Addon>
                    <Input
                        size="lg"
                        placeholder="Search participants, phone..."
                        value={search}
                        onChange={(v) => setSearch(v)}
                    />
                </InputGroup>
            </motion.div>

            {/* ================= INVESTOR CARD =================
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                    mb-8 rounded-3xl
                    border border-app-border
                    bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10
                    backdrop-blur-2xl
                    p-6
                "
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <Avatar
                            circle
                            size="lg"
                            className="
                                !bg-gradient-to-r
                                !from-cyan-500
                                !to-fuchsia-500
                                !text-app-text
                                !font-black
                            "
                        >
                            {investor?.Name?.charAt(0) || "U"}
                        </Avatar>

                        <div>
                            <h2 className="text-xl font-black">
                                {investor?.Name || "Unknown Investor"}
                            </h2>

                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <div className="flex items-center gap-2 text-sm text-app-secondary">
                                    <Phone size={14} />
                                    {investor?.Phone_No || registration?.phone}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-app-secondary">
                                    <CalendarDays size={14} />
                                    {registration?.createdAt
                                        ? format(
                                            new Date(registration.createdAt),
                                            "dd MMM yyyy hh:mm a"
                                        )
                                        : "--"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Tag
                            className="
                                !bg-cyan-500/20
                                !text-cyan-300
                                !border
                                !border-cyan-500/30
                            "
                        >
                            {event?.isPaid ? "PAID EVENT" : "FREE EVENT"}
                        </Tag>

                        <Tag
                            className="
                                !bg-emerald-500/20
                                !text-emerald-300
                                !border
                                !border-emerald-500/30
                            "
                        >
                            {registration?.isCheckedIn
                                ? "CHECKED IN"
                                : "NOT CHECKED"}
                        </Tag>
                    </div>
                </div>
            </motion.div> */}

            {/* ================= PARTICIPANTS ================= */}
            <div className="space-y-5">
                {loading ? (
                    <div
                        className="
                            rounded-3xl border border-app-border
                            bg-app-surface backdrop-blur-xl
                            p-10 text-center
                        "
                    >
                        <div
                            className="
                                w-12 h-12 mx-auto rounded-full
                                border-4 border-cyan-500/20
                                border-t-cyan-400 animate-spin
                            "
                        />

                        <p className="mt-4 text-app-secondary">
                            Loading registration details...
                        </p>
                    </div>
                ) : attendees?.length === 0 ? (
                    <div
                        className="
                            rounded-3xl border border-dashed border-app-border
                            bg-app-surface backdrop-blur-xl
                            p-14 text-center
                        "
                    >
                        <h2 className="text-xl font-bold text-app-text">
                            No Participants Found
                        </h2>

                        <p className="text-app-secondary mt-2">
                            No matching registration participants available.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="app-card overflow-hidden">
                            <RegistrationDataTable
                                rows={attendees}
                                columns={[...REGISTRATION_TABLE_LAYOUTS.eventDetail]}
                                event={event}
                            />
                        </div>
                    </>

                )}
            </div>
        </div>
    );
}

export default EventRegistorDataTable;



//  <motion.div
//                         key={index}
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{
//                             duration: 0.35,
//                             delay: index * 0.05,
//                         }}
//                         whileHover={{
//                             y: -3,
//                         }}
//                         className="
//                             group relative overflow-hidden
//                             rounded-3xl border border-app-border
//                             bg-app-surface backdrop-blur-2xl
//                             p-6
//                             transition-all duration-500
//                             hover:border-cyan-500/30
//                             hover:bg-white/[0.07]
//                         "
//                     >
//                         {/* Glow */}
//                         <div
//                             className="
//                                 absolute inset-0 opacity-0
//                                 group-hover:opacity-100
//                                 transition duration-500
//                                 bg-gradient-to-r
//                                 from-cyan-500/5
//                                 via-blue-500/5
//                                 to-fuchsia-500/5
//                             "
//                         />

//                         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
//                             {/* LEFT */}
//                             <div className="flex items-center gap-5">
//                                 <div
//                                     className="
//                                         w-16 h-16 rounded-2xl
//                                         bg-gradient-to-br
//                                         from-cyan-500
//                                         via-blue-500
//                                         to-fuchsia-500
//                                         flex items-center justify-center
//                                         text-2xl font-black
//                                         shadow-2xl shadow-cyan-500/20
//                                     "
//                                 >
//                                     {user?.investor?.Name?.charAt(0) || "U"}
//                                 </div>

//                                 <div>
//                                     <h3
//                                         className="
//                                             text-xl font-black
//                                             text-app-text
//                                             group-hover:text-cyan-300
//                                             transition
//                                         "
//                                     >
//                                         {user?.investor?.Name}
//                                     </h3>

//                                     <p className="text-app-secondary text-sm mt-1">
//                                         {user?.email || "No email added"}
//                                     </p>

//                                     <p className="text-gray-500 text-sm mt-1">
//                                         {user?.investor?.Phone_No ||
//                                             registration?.phone}
//                                     </p>
//                                 </div>
//                             </div>

//                             {/* RIGHT */}
//                             <div className="flex flex-wrap items-center gap-4">
//                                 {/* STATUS */}
//                                 <div
//                                     className={clsx(
//                                         `
//                                         px-5 py-2 rounded-full
//                                         text-sm font-bold
//                                         flex items-center gap-2
//                                         border
//                                         `,
//                                         registration?.isCheckedIn
//                                             ? `
//                                                 bg-emerald-500/15
//                                                 text-emerald-300
//                                                 border-emerald-500/20
//                                             `
//                                             : `
//                                                 bg-yellow-500/15
//                                                 text-yellow-300
//                                                 border-yellow-500/20
//                                             `
//                                     )}
//                                 >
//                                     <UserCheck className="w-4 h-4" />

//                                     {registration?.isCheckedIn
//                                         ? "Checked In"
//                                         : "Pending"}
//                                 </div>

//                                 {/* PAYMENT */}
//                                 <Tag
//                                     className={clsx(
//                                         `
//                                         !px-4 !py-2
//                                         !rounded-full
//                                         !font-bold
//                                         !border
//                                         `,
//                                         payment?.status === "success"
//                                             ? `
//                                                 !bg-green-500/20
//                                                 !text-green-300
//                                                 !border-green-500/30
//                                             `
//                                             : `
//                                                 !bg-yellow-500/20
//                                                 !text-yellow-300
//                                                 !border-yellow-500/30
//                                             `
//                                     )}
//                                 >
//                                     {payment?.status || "FREE"}
//                                 </Tag>

//                                 {/* ACTIONS */}
//                                 <div className="flex items-center gap-2">
//                                     <IconButton
//                                         icon={<Eye size={17} />}
//                                         appearance="subtle"
//                                         className="
//                                             !text-cyan-300
//                                             hover:!bg-cyan-500/10
//                                             hover:scale-110
//                                             transition-all
//                                         "
//                                     />

//                                     <IconButton
//                                         icon={<Trash2 size={17} />}
//                                         appearance="subtle"
//                                         className="
//                                             !text-red-300
//                                             hover:!bg-red-500/10
//                                             hover:scale-110
//                                             transition-all
//                                         "
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </motion.div>