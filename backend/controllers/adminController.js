import redisClient from "../config/redis.js";
import investorsModal from "../models/Investor.js";
import mongoose from "mongoose";
import eventModel from "../models/eventModel.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import Investor from "../models/Investor.js";
import Payment from "../models/paymentModel.js";
import {
    buildInvestorLookupByPhone,
    repairRegistrationInvestorIds,
    formatRegistrationInvestor,
} from "../utils/resolveRegistrationInvestors.js";
import { buildInvestorSearchFilter } from "../utils/investorSearch.js";



// 🔹 COMMON CACHE CLEAR FUNCTION
const clearInvestorCache = async () => {
    try {
        const keys = await redisClient.keys("investors:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        await redisClient.del("dashboard:summary:v2");
    } catch (err) {
        console.log("Redis clear error:", err);
    }
};

const VALID_GENDERS = ["Male", "Female", "Other"];

const normalizeGender = (gender) => {
    if (!gender || typeof gender !== "string") return null;
    const trimmed = gender.trim();
    const match = VALID_GENDERS.find(
        (g) => g.toLowerCase() === trimmed.toLowerCase()
    );
    return match || null;
};

// 🔹 CREATE INVESTOR
export const uploadInvestorDetails = async (req, res) => {
    try {
        let { Code_No, Name, Phone_No, Gender } = req.body;

        // ✅ FORMAT
        Code_No = Code_No?.trim().toUpperCase();
        Phone_No = Phone_No?.toString().trim();
        Gender = normalizeGender(Gender);

        if (!Code_No || !Name || !Phone_No || !Gender) {
            return res.status(400).json({
                status: false,
                message: "All fields are required (Code, Name, Phone, Gender)",
            });
        }

        // 🔴 DUPLICATE CHECK
        const existing = await investorsModal.findOne({
            $or: [{ Code_No }, { Phone_No }],
        });

        if (existing) {
            return res.status(400).json({
                status: false,
                message: "Code or Phone already exists",
            });
        }

        let newInvestor;

        // 🔁 retry logic (max 3 times)
        for (let i = 0; i < 3; i++) {

            const lastInvestor = await investorsModal
                .findOne()
                .sort({ No: -1 })
                .lean();

            const nextNo = lastInvestor ? lastInvestor.No + 1 : 1;

            try {
                newInvestor = await investorsModal.create({
                    No: nextNo,
                    Code_No,
                    Name,
                    Phone_No,
                    Gender,
                });
                break; // success
            } catch (err) {
                // duplicate No വന്നാൽ retry
                if (err.code === 11000) continue;
                throw err;
            }
        }

        if (!newInvestor) {
            return res.status(500).json({
                status: false,
                message: "Failed to generate unique number",
            });
        }

        // 🔥 CLEAR CACHE
        await clearInvestorCache();

        res.json({
            status: true,
            message: "Investor added successfully",
            data: newInvestor,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};

// 🔹 FETCH INVESTORS (WITH CACHE)
export const fetchInvestorData = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            sortBy,
            sortOrder,
            gender = "",
        } = req.body;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const cacheKey = `investors:${page}:${limit}:${search}:${sortBy}:${sortOrder}:${gender}`;

        // ✅ CACHE CHECK
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("⚡ From Redis");
            return res.json(JSON.parse(cachedData));
        }

        const conditions = [];

        const searchFilter = buildInvestorSearchFilter(search, normalizeGender);
        if (searchFilter) {
            conditions.push(searchFilter);
        }

        const genderFilter = normalizeGender(gender);
        if (genderFilter) {
            conditions.push({ Gender: genderFilter });
        }

        const query = conditions.length > 0 ? { $and: conditions } : {};

        const sortField = sortBy || "createdAt";

        const total = await investorsModal.countDocuments(query);

        const data = await investorsModal.find(query)
            .sort({ [sortField]: sortOrder === "desc" ? -1 : 1 })
            .skip(skip)
            .limit(limitNum);

        const result = { data, total };

        // ✅ CACHE SAVE
        await redisClient.setEx(cacheKey, 60, JSON.stringify(result));

        console.log("📦 From DB");

        res.json(result);

    } catch (error) {
        console.log("Fetch Error:", error);

        res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};

// 🔹 DASHBOARD SUMMARY
export const getDashboardSummary = async (req, res) => {
    try {
        const cacheKey = "dashboard:summary:v2";

        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log("⚡ Dashboard Cache");
            return res.json(JSON.parse(cachedData));
        }

        const totalInvestors = await investorsModal.estimatedDocumentCount();

        const genderCounts = await investorsModal.aggregate([
            {
                $group: {
                    _id: "$Gender",
                    count: { $sum: 1 },
                },
            },
        ]);

        const countByGender = genderCounts.reduce(
            (acc, item) => {
                acc[item._id] = item.count;
                return acc;
            },
            {}
        );

        const entryPassesIssued = await RegEventModel.estimatedDocumentCount();
        const verifiedCheckIns = await RegEventModel.countDocuments({ isCheckedIn: true });

        const guestAgg = await RegEventModel.aggregate([
            {
                $project: {
                    guestCount: { $size: { $ifNull: ["$participants", []] } },
                },
            },
            {
                $group: {
                    _id: null,
                    subMembers: { $sum: "$guestCount" },
                },
            },
        ]);

        const result = {
            totalInvestors,
            maleCount: countByGender.Male || 0,
            femaleCount: countByGender.Female || 0,
            otherCount: countByGender.Other || 0,
            entryPassesIssued,
            verifiedCheckIns,
            mainMembers: entryPassesIssued,
            subMembers: guestAgg[0]?.subMembers || 0,
        };

        await redisClient.setEx(cacheKey, 120, JSON.stringify(result));

        res.json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};

// 🔹 UPDATE INVESTOR
export const updateInvestor = async (req, res) => {
    try {
        const { id } = req.params;
        let { Code_No, Phone_No, Name, Gender } = req.body;

        // ✅ FORMAT
        Code_No = Code_No?.trim().toUpperCase();
        Phone_No = Phone_No?.toString().trim();
        Gender = normalizeGender(Gender);

        if (!Code_No || !Name || !Phone_No || !Gender) {
            return res.status(400).json({
                status: false,
                message: "All fields are required (Code, Name, Phone, Gender)",
            });
        }

        // 🔴 DUPLICATE CHECK
        const existing = await investorsModal.findOne({
            _id: { $ne: id },
            $or: [{ Code_No }, { Phone_No }],
        });

        if (existing) {
            return res.status(400).json({
                status: false,
                message: "Code or Phone already exists",
            });
        }

        const updated = await investorsModal.findByIdAndUpdate(
            id,
            { Code_No, Phone_No, Name, Gender },
            { new: true }
        );

        await clearInvestorCache();

        res.json({
            status: true,
            message: "Updated successfully",
            data: updated,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};

// 🔹 DELETE INVESTOR
export const deleteInvestor = async (req, res) => {
    try {
        const { id } = req.params;

        await investorsModal.findByIdAndDelete(id);

        await clearInvestorCache();

        res.json({
            status: true,
            message: "Deleted successfully",
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};



//

// export const registrationDetails = async (req, res) => {
//     try {
//         const { id } = req.body;

//         console.log(id, "eventId");

//         // ================= VALIDATION =================
//         if (!id) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Event ID is required",
//             });
//         }

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid event ID",
//             });
//         }

//         // ================= GET REGISTRATION =================
//         const registration = await RegEventModel.findOne({
//             eventId: id,
//         })
//             .populate({
//                 path: "eventId",
//                 model: eventModel,
//                 select: `
//           title
//           description
//           eventDays
//           maxParticipants
//           maxPerUser
//           isPaid
//           price
//           isRefundable
//           allowGuests
//           locationType
//           location
//           isRegistrationClosed
//           createdAt
//         `,
//             })
//             .populate({
//                 path: "investorId",
//                 model: Investor,
//                 select: `
//           No
//           Code_No
//           Name
//           Phone_No
//           role
//           createdAt
//         `,
//             })
//             .lean();

//         // ================= NOT FOUND =================
//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found for this event",
//             });
//         }

//         // ================= PAYMENT DETAILS =================
//         let payment = null;

//         if (registration?.eventId?.isPaid) {
//             payment = await Payment.findOne({
//                 eventId: registration.eventId._id,
//                 phone: registration.phone,
//             })
//                 .sort({ createdAt: -1 })
//                 .select(`
//           amount
//           currency
//           status
//           method
//           razorpay_order_id
//           razorpay_payment_id
//           paidAt
//           failedAt
//           refundId
//           refundAmount
//           refundedAt
//           createdAt
//         `)
//                 .lean();
//         }

//         // ================= RESPONSE =================
//         return res.status(200).json({
//             success: true,
//             message: "Registration details fetched successfully",

//             data: {
//                 registration: {
//                     _id: registration._id,

//                     phone: registration.phone,

//                     participantsCount:
//                         registration?.participants?.length || 0,

//                     participants: registration.participants || [],

//                     qrToken: registration.qrToken,

//                     qrCodeImage: registration.qrCodeImage,

//                     isCheckedIn: registration.isCheckedIn,

//                     checkedInAt: registration.checkedInAt,

//                     createdAt: registration.createdAt,
//                 },

//                 investor: registration.investorId || null,

//                 event: registration.eventId || null,

//                 payment: payment || null,
//             },
//         });
//     } catch (error) {
//         console.error("Registration Details Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error:
//                 process.env.NODE_ENV === "development"
//                     ? error.message
//                     : undefined,
//         });
//     }
// };

export const registrationDetails = async (req, res) => {
    try {
        let { id } = req.body;

        // Accept { id: "..." } nested from some clients
        if (id && typeof id === "object" && id.id) {
            id = id.id;
        }

        if (typeof id === "string") {
            id = id.trim();
        }

        console.log(id, "EVENT_ID");

        // ================= VALIDATION =================
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID",
            });
        }

        // ================= EVENT DETAILS =================
        const event = await eventModel.findById(id).lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        // ================= REGISTRATIONS =================
        const registrations = await RegEventModel.find({
            eventId: id,
        })
            .populate({
                path: "eventId",
                model: eventModel,
                select: `
          title
          description
          eventDays
          maxParticipants
          maxPerUser
          isPaid
          price
          isRefundable
          allowGuests
          locationType
          location
          isRegistrationClosed
          createdAt
          updatedAt
        `,
            })
            .populate({
                path: "investorId",
                model: Investor,
                select: `
          No
          Code_No
          Name
          Phone_No
          role
          createdAt
          updatedAt
        `,
            })
            .sort({ createdAt: -1 })
            .lean();

        const investorByPhone = await buildInvestorLookupByPhone(
            registrations.map((item) => item.phone)
        );
        await repairRegistrationInvestorIds(
            registrations,
            investorByPhone
        );

        // ================= PAYMENT DETAILS =================
        const phones = registrations.map((item) => item.phone);

        const payments = await Payment.find({
            eventId: id,
            phone: { $in: phones },
        })
            .sort({ createdAt: -1 })
            .select(`
        eventId
        phone
        amount
        currency
        status
        method
        razorpay_order_id
        razorpay_payment_id
        razorpay_signature
        paidAt
        failedAt
        refundId
        refundAmount
        refundedAt
        createdAt
        updatedAt
      `)
            .lean();

        // ================= FORMAT REGISTRATION DATA =================
        const formattedRegistrations = registrations.map((registration) => {
            const payment = payments.find(
                (item) => item.phone === registration.phone
            );

            return {
                _id: registration._id,

                registrationId: registration._id,

                investor: formatRegistrationInvestor(
                    registration,
                    investorByPhone
                ),

                event: registration.eventId || null,

                phone: registration.phone,

                participants: registration.participants || [],

                participantsCount:
                    registration?.participants?.length || 0,

                qrToken: registration.qrToken || null,

                qrCodeImage: registration.qrCodeImage || null,

                isCheckedIn: registration.isCheckedIn,

                checkedInAt: registration.checkedInAt || null,

                payment: payment || null,

                createdAt: registration.createdAt,

                updatedAt: registration.updatedAt,
            };
        });

        // ================= STATISTICS =================
        const totalRegistrations = registrations.length;

        const totalParticipants = registrations.reduce(
            (acc, curr) =>
                acc + (curr?.participants?.length || 0),
            0
        );

        const checkedInCount = registrations.filter(
            (item) => item.isCheckedIn
        ).length;

        const pendingCheckInCount = registrations.filter(
            (item) => !item.isCheckedIn
        ).length;

        const successfulPayments = payments.filter(
            (item) => item.status === "success"
        );

        const failedPayments = payments.filter(
            (item) => item.status === "failed"
        );

        const refundedPayments = payments.filter(
            (item) => item.status === "refunded"
        );

        const totalRevenue = successfulPayments.reduce(
            (acc, curr) => acc + curr.amount,
            0
        );

        // ================= RESPONSE =================
        return res.status(200).json({
            success: true,
            message: "Event registration details fetched successfully",

            data: {
                event,

                statistics: {
                    totalRegistrations,
                    totalParticipants,
                    checkedInCount,
                    pendingCheckInCount,

                    successfulPayments: successfulPayments.length,

                    failedPayments: failedPayments.length,

                    refundedPayments: refundedPayments.length,

                    totalRevenue,
                },

                registrations: formattedRegistrations,
            },
        });
    } catch (error) {
        console.error("Registration Details Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

