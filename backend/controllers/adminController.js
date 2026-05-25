import { redisGet, redisSetEx } from "../config/redis.js";
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
import {
    buildRegistrationGenderBreakdown,
    aggregateGuestGenderFromPipeline,
    guestCountsFromAgg,
    normalizeGender,
    resolveInvestorGender,
} from "../utils/gender.js";
import {
    findInvestorDuplicate,
    parseInvestorObjectId,
    prepareInvestorCreateInput,
    prepareInvestorUpdateInput,
} from "../utils/investorCrud.js";
import { emitRegistrationBlocked } from "../live/liveHub.js";
import { clearDashboardCache, clearInvestorListCache, notifyDashboardMetricsChanged } from "../utils/dashboardCache.js";
import razorpay, { isRazorpayConfigured } from "../utils/razorpayClient.js";
import {
    REFUND_REASONS,
    applyRefundToPayment,
    getRefundableRemaining,
    getLatestRefundStatus,
    mapRefundEntry,
    previewAccessAfterRefund,
    syncAccessAfterRefund,
} from "../utils/paymentRefund.js";
import { logAuditAction } from "../utils/auditLog.js";
import { notifyUser } from "../utils/notifications.js";
import { createNotification } from "../services/notificationService.js";
import { withLock } from "../utils/distributedLock.js";



const clearInvestorCache = async () => {
    await clearInvestorListCache();
};

// 🔹 CREATE INVESTOR
export const uploadInvestorDetails = async (req, res) => {
    try {
        const prepared = prepareInvestorCreateInput(req.body);
        if (!prepared.ok) {
            return res.status(400).json({
                status: false,
                message: prepared.message,
            });
        }

        const { fields, genderResolution } = prepared;

        const duplicate = await findInvestorDuplicate(investorsModal, {
            code: fields.Code_No,
            phoneNumber: fields.Phone_No,
        });
        if (duplicate) {
            return res.status(409).json({
                status: false,
                message: duplicate.message,
                field: duplicate.field,
            });
        }

        let newInvestor;

        for (let i = 0; i < 3; i++) {
            const lastInvestor = await investorsModal
                .findOne()
                .sort({ No: -1 })
                .lean();

            const nextNo = lastInvestor ? lastInvestor.No + 1 : 1;

            try {
                newInvestor = await investorsModal.create({
                    No: nextNo,
                    ...fields,
                });
                break;
            } catch (err) {
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

        await clearInvestorCache();

        res.status(201).json({
            status: true,
            message: "Investor added successfully",
            data: newInvestor,
            genderCorrected: genderResolution.corrected,
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
        const cachedData = await redisGet(cacheKey);
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
        await redisSetEx(cacheKey, 60, JSON.stringify(result));

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
        const cacheKey = "dashboard:summary:v5";

        const cachedData = await redisGet(cacheKey);

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

        const passStats = await RegEventModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalRegistrations: { $sum: 1 },
                    guestPasses: {
                        $sum: { $size: { $ifNull: ["$participants", []] } },
                    },
                    investorCheckIns: {
                        $sum: { $cond: [{ $eq: ["$isCheckedIn", true] }, 1, 0] },
                    },
                },
            },
        ]);

        const guestCheckInAgg = await RegEventModel.aggregate([
            { $unwind: "$participants" },
            { $match: { "participants.isCheckedIn": true } },
            { $count: "guestCheckIns" },
        ]);

        const totalRegistrations = passStats[0]?.totalRegistrations || 0;
        const guestPasses = passStats[0]?.guestPasses || 0;
        const investorPasses = totalRegistrations;
        const entryPassesIssued = investorPasses + guestPasses;
        const investorCheckIns = passStats[0]?.investorCheckIns || 0;
        const guestCheckIns = guestCheckInAgg[0]?.guestCheckIns || 0;
        const verifiedCheckIns = investorCheckIns + guestCheckIns;
        const pendingCheckIn = Math.max(entryPassesIssued - verifiedCheckIns, 0);
        const checkInRate =
            entryPassesIssued > 0
                ? Math.round((verifiedCheckIns / entryPassesIssued) * 100)
                : 0;

        const revenueAgg = await Payment.aggregate([
            { $match: { status: { $in: ["success", "refunded"] } } },
            {
                $project: {
                    amount: { $ifNull: ["$amount", 0] },
                    processedRefund: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: { $ifNull: ["$refunds", []] },
                                        as: "refund",
                                        cond: { $eq: ["$$refund.status", "processed"] },
                                    },
                                },
                                as: "processed",
                                in: { $ifNull: ["$$processed.amount", 0] },
                            },
                        },
                    },
                    fallbackRefund: {
                        $cond: [
                            { $eq: ["$status", "refunded"] },
                            { $ifNull: ["$refundAmount", "$amount"] },
                            0,
                        ],
                    },
                },
            },
            {
                $project: {
                    netRevenue: {
                        $max: [
                            0,
                            {
                                $subtract: [
                                    "$amount",
                                    {
                                        $cond: [
                                            { $gt: ["$processedRefund", 0] },
                                            "$processedRefund",
                                            "$fallbackRefund",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
            { $group: { _id: null, totalRevenue: { $sum: "$netRevenue" } } },
        ]);
        const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

        const guestGenderAgg = await RegEventModel.aggregate(
            aggregateGuestGenderFromPipeline()
        );
        const guestGenderCounts = guestCountsFromAgg(guestGenderAgg);

        const result = {
            totalInvestors,
            totalRegistrations,
            entryPassesIssued,
            investorPasses,
            guestPasses,
            verifiedCheckIns,
            pendingCheckIn,
            checkInRate,
            totalRevenue,
            maleCount: countByGender.Male || 0,
            femaleCount: countByGender.Female || 0,
            otherCount: countByGender.Other || 0,
            ...guestGenderCounts,
            mainMembers: totalRegistrations,
            subMembers: guestPasses,
        };

        await redisSetEx(cacheKey, 120, JSON.stringify(result));

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
        const investorId = parseInvestorObjectId(req.params.id);
        if (!investorId) {
            return res.status(400).json({
                status: false,
                message: "Invalid investor ID",
            });
        }

        const prepared = prepareInvestorUpdateInput(req.body);
        if (!prepared.ok) {
            return res.status(400).json({
                status: false,
                message: prepared.message,
            });
        }

        const { fields } = prepared;

        const duplicate = await findInvestorDuplicate(investorsModal, {
            code: fields.Code_No,
            phoneNumber: fields.Phone_No,
            excludeId: investorId,
        });
        if (duplicate) {
            return res.status(409).json({
                status: false,
                message: duplicate.message,
                field: duplicate.field,
            });
        }

        const updated = await investorsModal.findByIdAndUpdate(
            investorId,
            fields,
            { returnDocument: "after", runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                status: false,
                message: "Investor not found",
            });
        }

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

// 🔹 FIX INVESTOR GENDERS FROM NAMES (batch — does not touch auth/OAuth)
export const fixInvestorGendersFromNames = async (req, res) => {
    try {
        const dryRun = req.body?.dryRun !== false && req.query?.dryRun !== "false";
        const investors = await investorsModal.find().select("_id Name Gender Code_No").lean();

        const changes = [];
        for (const row of investors) {
            const resolution = resolveInvestorGender(row.Name, row.Gender);
            if (resolution.gender !== row.Gender) {
                changes.push({
                    id: row._id,
                    code: row.Code_No,
                    from: row.Gender,
                    to: resolution.gender,
                    matchReason: resolution.matchReason,
                });
            }
        }

        if (!dryRun && changes.length > 0) {
            const bulk = changes.map((c) => ({
                updateOne: {
                    filter: { _id: c.id },
                    update: { $set: { Gender: c.to } },
                },
            }));
            await investorsModal.bulkWrite(bulk);
            await clearInvestorCache();
        }

        res.json({
            status: true,
            dryRun,
            total: investors.length,
            changes: changes.length,
            preview: changes.slice(0, 50),
            message: dryRun
                ? `Dry run: ${changes.length} investor(s) would be updated`
                : `Updated ${changes.length} investor gender(s) from name`,
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
        const investorId = parseInvestorObjectId(req.params.id);
        if (!investorId) {
            return res.status(400).json({
                status: false,
                message: "Invalid investor ID",
            });
        }

        const deleted = await investorsModal.findByIdAndDelete(investorId);
        if (!deleted) {
            return res.status(404).json({
                status: false,
                message: "Investor not found",
            });
        }

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
          Gender
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
        guestCount
        breakdown
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

        const paidTotalByPhone = {};
        const successPaymentsByPhone = {};

        for (const payment of payments) {
            const phone = payment.phone;
            if (!successPaymentsByPhone[phone]) {
                successPaymentsByPhone[phone] = [];
            }
            if (payment.status === "success") {
                successPaymentsByPhone[phone].push(payment);
                paidTotalByPhone[phone] =
                    (paidTotalByPhone[phone] || 0) + Number(payment.amount || 0);
            }
        }

        // ================= FORMAT REGISTRATION DATA =================
        const formattedRegistrations = registrations.map((registration) => {
            const phone = registration.phone;
            const phonePayments = payments.filter((item) => item.phone === phone);
            const latestPayment = phonePayments[0] || null;
            const successPayments = successPaymentsByPhone[phone] || [];
            const paidTotal = paidTotalByPhone[phone] || 0;

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

                isBlocked: Boolean(registration.isBlocked),
                blockedAt: registration.blockedAt || null,
                blockedReason: registration.blockedReason || "",

                payment: latestPayment
                    ? {
                        ...latestPayment,
                        paidTotal,
                        successPayments,
                    }
                    : paidTotal > 0
                      ? { paidTotal, successPayments, status: "success" }
                      : null,

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

        const checkedInCount = registrations.filter((item) => {
            if (item.isCheckedIn) return true;
            return (item.participants || []).some((p) => p.isCheckedIn);
        }).length;

        const pendingCheckInCount = registrations.filter((item) => {
            if (item.isCheckedIn) return false;
            const anyGuestCheckedIn = (item.participants || []).some((p) => p.isCheckedIn);
            return !anyGuestCheckedIn;
        }).length;

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

        const genderBreakdown = buildRegistrationGenderBreakdown(
            registrations,
            investorByPhone
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

                    genderBreakdown,
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

function buildPaymentLedgerQuery(body = {}) {
    const {
        eventId,
        status = "all",
        search = "",
        dateFrom,
        dateTo,
    } = body;

    const query = {};

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.eventId = new mongoose.Types.ObjectId(eventId);
    }

    if (status && status !== "all") {
        query.status = status === "pending" ? "created" : status;
    }

    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    return { query, search: String(search || "").trim() };
}

async function applyPaymentSearch(query, search) {
    if (!search) return query;

    const or = [
        { razorpay_order_id: { $regex: search, $options: "i" } },
        { razorpay_payment_id: { $regex: search, $options: "i" } },
    ];

    const digits = search.replace(/\D/g, "");
    if (digits.length >= 4) {
        or.push({ phone: { $regex: digits } });
    }

    const nameMatches = await investorsModal
        .find({ Name: { $regex: search, $options: "i" } })
        .select("Phone_No")
        .limit(100)
        .lean();

    const phones = nameMatches
        .map((item) => String(item.Phone_No || "").replace(/\D/g, ""))
        .filter(Boolean);

    if (phones.length) {
        or.push({ phone: { $in: phones } });
    }

    return { ...query, $or: or };
}

function getRowProcessedRefund(row) {
    if (Array.isArray(row.refunds) && row.refunds.length) {
        return row.refunds
            .filter((entry) => entry.status === "processed")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    }
    if (row.status === "refunded") {
        return Number(row.refundAmount || row.amount || 0);
    }
    return 0;
}

function getRowActiveRefund(row) {
    if (Array.isArray(row.refunds) && row.refunds.length) {
        return row.refunds
            .filter((entry) => entry.status !== "failed")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    }
    return Number(row.refundAmount || 0);
}

function summarizePayments(rows = []) {
    let totalRevenue = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;
    let refundedAmount = 0;

    for (const row of rows) {
        const amount = Number(row.amount || 0);
        const processedRefund = getRowProcessedRefund(row);
        const activeRefund = getRowActiveRefund(row);

        if (row.status === "success") {
            successfulCount += 1;
            totalRevenue += Math.max(0, amount - processedRefund);
            if (processedRefund > 0) {
                refundedAmount += processedRefund;
                refundedCount += 1;
            }
        } else if (row.status === "failed") {
            failedCount += 1;
        } else if (row.status === "created") {
            pendingCount += 1;
        } else if (row.status === "refunded") {
            refundedCount += 1;
            refundedAmount += processedRefund || activeRefund || amount;
            totalRevenue += Math.max(0, amount - (processedRefund || activeRefund || amount));
        }
    }

    return {
        totalRevenue,
        successfulCount,
        failedCount,
        pendingCount,
        refundedCount,
        refundedAmount,
    };
}

async function summarizePaymentsAggregation(query) {
    const [result] = await Payment.aggregate([
        { $match: query },
        {
            $addFields: {
                amountNum: { $toDouble: { $ifNull: ["$amount", 0] } },
                processedRefund: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ["$refunds", []] } }, 0] },
                        then: {
                            $sum: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: { $ifNull: ["$refunds", []] },
                                            as: "ref",
                                            cond: { $eq: ["$$ref.status", "processed"] },
                                        },
                                    },
                                    as: "ref",
                                    in: { $toDouble: { $ifNull: ["$$ref.amount", 0] } },
                                },
                            },
                        },
                        else: {
                            $cond: {
                                if: { $eq: ["$status", "refunded"] },
                                then: {
                                    $toDouble: {
                                        $ifNull: ["$refundAmount", { $ifNull: ["$amount", 0] }],
                                    },
                                },
                                else: 0,
                            },
                        },
                    },
                },
                activeRefund: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ["$refunds", []] } }, 0] },
                        then: {
                            $sum: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: { $ifNull: ["$refunds", []] },
                                            as: "ref",
                                            cond: { $ne: ["$$ref.status", "failed"] },
                                        },
                                    },
                                    as: "ref",
                                    in: { $toDouble: { $ifNull: ["$$ref.amount", 0] } },
                                },
                            },
                        },
                        else: { $toDouble: { $ifNull: ["$refundAmount", 0] } },
                    },
                },
            },
        },
        {
            $group: {
                _id: null,
                totalRevenue: {
                    $sum: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ["$status", "success"] },
                                    then: { $max: [0, { $subtract: ["$amountNum", "$processedRefund"] }] },
                                },
                                {
                                    case: { $eq: ["$status", "refunded"] },
                                    then: {
                                        $max: [
                                            0,
                                            {
                                                $subtract: [
                                                    "$amountNum",
                                                    {
                                                        $cond: {
                                                            if: { $gt: ["$processedRefund", 0] },
                                                            then: "$processedRefund",
                                                            else: {
                                                                $cond: {
                                                                    if: { $gt: ["$activeRefund", 0] },
                                                                    then: "$activeRefund",
                                                                    else: "$amountNum",
                                                                },
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            ],
                            default: 0,
                        },
                    },
                },
                successfulCount: {
                    $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
                },
                failedCount: {
                    $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
                },
                pendingCount: {
                    $sum: { $cond: [{ $eq: ["$status", "created"] }, 1, 0] },
                },
                refundedCount: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ["$status", "refunded"] },
                                    {
                                        $and: [
                                            { $eq: ["$status", "success"] },
                                            { $gt: ["$processedRefund", 0] },
                                        ],
                                    },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                refundedAmount: {
                    $sum: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ["$status", "success"] },
                                    then: "$processedRefund",
                                },
                                {
                                    case: { $eq: ["$status", "refunded"] },
                                    then: {
                                        $cond: {
                                            if: { $gt: ["$processedRefund", 0] },
                                            then: "$processedRefund",
                                            else: {
                                                $cond: {
                                                    if: { $gt: ["$activeRefund", 0] },
                                                    then: "$activeRefund",
                                                    else: "$amountNum",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                            default: 0,
                        },
                    },
                },
            },
        },
    ]);

    return (
        result || {
            totalRevenue: 0,
            successfulCount: 0,
            failedCount: 0,
            pendingCount: 0,
            refundedCount: 0,
            refundedAmount: 0,
        }
    );
}

function formatPaymentLedgerRow(payment, investor = null) {
    const eventDoc = payment.eventId;
    const eventIsRefundable = Boolean(eventDoc?.isRefundable);
    const refundableRemaining = getRefundableRemaining(payment);
    const latestRefundStatus = getLatestRefundStatus(payment);
    const canRefund =
        payment.status === "success" &&
        refundableRemaining > 0 &&
        Boolean(payment.razorpay_payment_id) &&
        eventIsRefundable;

    return {
        _id: payment._id,
        eventId: eventDoc?._id || payment.eventId,
        event: eventDoc
            ? {
                  _id: eventDoc._id,
                  title: eventDoc.title,
                  startTime: eventDoc.startTime,
                  endTime: eventDoc.endTime,
                  isRefundable: eventDoc.isRefundable,
              }
            : null,
        phone: payment.phone,
        investorName: investor?.Name || null,
        investorCode: investor?.Code_No || null,
        amount: payment.amount,
        currency: payment.currency || "INR",
        status: payment.status,
        method: payment.method || null,
        guestCount: payment.guestCount ?? 0,
        breakdown: payment.breakdown || null,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id || null,
        paidAt: payment.paidAt || null,
        failedAt: payment.failedAt || null,
        refundedAt: payment.refundedAt || null,
        refundAmount: payment.refundAmount || null,
        refundReason: payment.refundReason || null,
        refunds: (payment.refunds || []).map(mapRefundEntry),
        latestRefundStatus,
        isRefundable: eventIsRefundable,
        refundableRemaining,
        canRefund,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
    };
}

export const paymentLedger = async (req, res) => {
    try {
        const page = Math.max(Number(req.body?.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.body?.limit) || 25, 1), 100);

        const { query: baseQuery, search } = buildPaymentLedgerQuery(req.body);
        const query = await applyPaymentSearch(baseQuery, search);

        const [statistics, total, payments] = await Promise.all([
            summarizePaymentsAggregation(query),
            Payment.countDocuments(query),
            Payment.find(query)
                .populate("eventId", "title startTime endTime isRefundable")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ]);

        const investorByPhone = await buildInvestorLookupByPhone(
            payments.map((item) => item.phone)
        );

        const formattedPayments = payments.map((payment) => {
            const phoneKey = String(payment.phone || "").replace(/\D/g, "");
            const investor = investorByPhone.get(phoneKey) || null;
            return formatPaymentLedgerRow(payment, investor);
        });

        return res.status(200).json({
            success: true,
            data: {
                statistics,
                payments: formattedPayments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                },
            },
        });
    } catch (error) {
        console.error("Payment Ledger Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch payment ledger",
        });
    }
};

export const issuePaymentRefund = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { amount, reason, note, revokeAccess = true } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID",
            });
        }

        if (!REFUND_REASONS.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: "A valid refund reason is required",
            });
        }

        if (!isRazorpayConfigured()) {
            return res.status(503).json({
                success: false,
                message: "Razorpay is not configured",
            });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        if (payment.status !== "success") {
            return res.status(400).json({
                success: false,
                message: "Only successful payments can be refunded",
            });
        }

        if (!payment.razorpay_payment_id) {
            return res.status(400).json({
                success: false,
                message: "Razorpay payment ID missing — cannot refund",
            });
        }

        const event = await eventModel
            .findById(payment.eventId)
            .select("isRefundable title")
            .lean();

        if (!event?.isRefundable) {
            return res.status(400).json({
                success: false,
                message: "This event is not marked as refundable",
            });
        }

        const remaining = getRefundableRemaining(payment);
        if (remaining <= 0) {
            return res.status(400).json({
                success: false,
                message: "Payment is already fully refunded",
            });
        }

        const refundAmount =
            amount != null && amount !== "" ? Number(amount) : remaining;

        if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid refund amount",
            });
        }

        if (refundAmount > remaining + 0.001) {
            return res.status(400).json({
                success: false,
                message: `Maximum refundable amount is ${remaining}`,
            });
        }

        let refundResult;
        try {
            refundResult = await withLock(`refund:${paymentId}`, 60_000, async () => {
                const freshPayment = await Payment.findById(paymentId);
                if (!freshPayment || freshPayment.status !== "success") {
                    const err = new Error("Payment is not refundable");
                    err.status = 400;
                    throw err;
                }

                const remainingFresh = getRefundableRemaining(freshPayment);
                if (remainingFresh <= 0) {
                    const err = new Error("Payment is already fully refunded");
                    err.status = 400;
                    throw err;
                }

                const amountToRefund =
                    amount != null && amount !== "" ? Number(amount) : remainingFresh;

                if (!Number.isFinite(amountToRefund) || amountToRefund <= 0) {
                    const err = new Error("Invalid refund amount");
                    err.status = 400;
                    throw err;
                }

                if (amountToRefund > remainingFresh + 0.001) {
                    const err = new Error(`Maximum refundable amount is ${remainingFresh}`);
                    err.status = 400;
                    throw err;
                }

                const razorpayRefund = await razorpay.payments.refund(
                    freshPayment.razorpay_payment_id,
                    {
                        amount: Math.round(amountToRefund * 100),
                        notes: {
                            reason,
                            note: String(note || "").trim(),
                            paymentMongoId: freshPayment._id.toString(),
                        },
                    }
                );

                const adminId = req.user?.id || req.user?._id || null;
                const refundStatus = String(razorpayRefund?.status || "pending").toLowerCase();
                const { payment: updated, applied } = await applyRefundToPayment(freshPayment, {
                    refundId: razorpayRefund.id,
                    amount: amountToRefund,
                    reason,
                    note,
                    refundedBy: adminId,
                    status: refundStatus,
                    razorpayReceipt: razorpayRefund?.receipt || "",
                    speedRequested: razorpayRefund?.speed_requested || "",
                    speedProcessed: razorpayRefund?.speed_processed || "",
                    initiatedAt: razorpayRefund?.created_at
                        ? new Date(Number(razorpayRefund.created_at) * 1000)
                        : new Date(),
                    processedAt:
                        refundStatus === "processed"
                            ? new Date()
                            : null,
                });

                return {
                    updated,
                    applied,
                    refundAmount: amountToRefund,
                    refundStatus,
                    razorpayRefund,
                };
            });
        } catch (lockErr) {
            if (lockErr.code === "LOCK_BUSY") {
                return res.status(409).json({
                    success: false,
                    message: lockErr.message,
                });
            }
            if (lockErr.status) {
                return res.status(lockErr.status).json({
                    success: false,
                    message: lockErr.message,
                });
            }
            throw lockErr;
        }

        const { payment: updated, applied, refundAmount: finalRefundAmount, refundStatus } =
            refundResult;

        if (!applied) {
            return res.status(409).json({
                success: false,
                message: "Refund already recorded",
            });
        }

        let accessImpact = null;
        if (revokeAccess !== false) {
            accessImpact = await syncAccessAfterRefund(
                payment.eventId,
                payment.phone,
                {
                    reason:
                        note ||
                        `Refund: ${String(reason).replace(/_/g, " ")}`,
                }
            );
        }

        await logAuditAction({
            action: "payment.refund",
            category: "refund",
            actor: req.user,
            targetType: "payment",
            targetId: updated._id,
            eventId: payment.eventId,
            phone: payment.phone,
            metadata: {
                amount: finalRefundAmount,
                reason,
                note,
                accessImpact,
            },
            req,
        });

        notifyUser({
            phone: payment.phone,
            eventTitle: event?.title || "Event",
            template: "refund_processed",
            message: `A refund of INR ${finalRefundAmount} has been initiated for your ${event?.title || "Event"} registration.`,
        }).catch(() => {});

        createNotification("refund.initiated", {
            eventId: String(payment.eventId),
            eventTitle: event?.title || "Event",
            phone: payment.phone,
            amount: finalRefundAmount,
            paymentId: String(payment._id),
            entity: {
                type: "payment",
                id: String(payment._id),
                eventId: String(payment.eventId),
                phone: payment.phone,
            },
            alsoNotifyPassUser: { eventId: String(payment.eventId), phone: payment.phone },
            sender: req.user,
        }).catch(() => {});

        await notifyDashboardMetricsChanged();

        const investorByPhone = await buildInvestorLookupByPhone([updated.phone]);
        const phoneKey = String(updated.phone || "").replace(/\D/g, "");
        const investor = investorByPhone.get(phoneKey) || null;
        const populated = await Payment.findById(updated._id)
            .populate("eventId", "title startTime endTime isRefundable")
            .lean();

        const responseMessage =
            refundStatus === "processed"
                ? "Refund sent via Razorpay to original payment method"
                : "Refund initiated — processing via Razorpay (typically 5–7 business days for some methods)";

        return res.status(200).json({
            success: true,
            message: responseMessage,
            data: formatPaymentLedgerRow(populated, investor),
            accessImpact,
        });
    } catch (error) {
        console.error("Issue Payment Refund Error:", error);
        const message =
            error?.error?.description ||
            error?.message ||
            "Failed to process refund";
        return res.status(500).json({
            success: false,
            message,
        });
    }
};

export const previewPaymentRefundAccess = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { amount } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID",
            });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        const refundAmount = Number(amount);
        if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid refund amount",
            });
        }

        const accessImpact = await previewAccessAfterRefund(
            payment.eventId,
            payment.phone,
            refundAmount
        );

        if (!accessImpact) {
            return res.status(404).json({
                success: false,
                message: "Registration not found for this payment",
            });
        }

        return res.status(200).json({
            success: true,
            data: accessImpact,
        });
    } catch (error) {
        console.error("Preview Payment Refund Access Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to preview refund access impact",
        });
    }
};

export const blockRegistrationParticipant = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { target, guestIndex, blocked, reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(registrationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration ID",
            });
        }

        if (!["investor", "guest"].includes(target)) {
            return res.status(400).json({
                success: false,
                message: "target must be investor or guest",
            });
        }

        if (typeof blocked !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "blocked must be a boolean",
            });
        }

        const registration = await RegEventModel.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found",
            });
        }

        const now = blocked ? new Date() : null;
        const reasonText = blocked ? String(reason || "").trim() : "";

        if (target === "investor") {
            registration.isBlocked = blocked;
            registration.blockedAt = now;
            registration.blockedReason = reasonText;
        } else {
            const index = Number(guestIndex);
            if (!Number.isInteger(index) || index < 0 || index >= registration.participants.length) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid guest index",
                });
            }
            registration.participants[index].isBlocked = blocked;
            registration.participants[index].blockedAt = now;
            registration.participants[index].blockedReason = reasonText;
            registration.markModified("participants");
        }

        await registration.save();

        const resolvedGuestIndex = target === "guest" ? Number(guestIndex) : null;

        await logAuditAction({
            action: blocked ? "registration.block" : "registration.unblock",
            category: "block",
            actor: req.user,
            targetType: target,
            targetId: registration._id,
            eventId: registration.eventId,
            phone: registration.phone,
            metadata: { guestIndex: resolvedGuestIndex, reason: reasonText },
            req,
        });

        emitRegistrationBlocked({
            eventId: String(registration.eventId),
            registrationId: String(registration._id),
            phone: registration.phone,
            target,
            guestIndex: resolvedGuestIndex,
            participantId:
                target === "guest" && resolvedGuestIndex != null
                    ? String(registration.participants[resolvedGuestIndex]?._id || "")
                    : null,
            isBlocked: blocked,
            blockedReason: reasonText,
        });

        if (blocked) {
            createNotification("registration.blocked", {
                eventId: String(registration.eventId),
                phone: registration.phone,
                registrationId: String(registration._id),
                blockedReason: reasonText,
                entity: {
                    type: "registration",
                    id: String(registration._id),
                    eventId: String(registration.eventId),
                    phone: registration.phone,
                },
                sender: req.user,
            }).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: blocked ? "Entry blocked" : "Block removed",
            data: {
                _id: registration._id,
                isBlocked: registration.isBlocked,
                blockedAt: registration.blockedAt,
                blockedReason: registration.blockedReason,
                participants: registration.participants,
            },
        });
    } catch (error) {
        console.error("Block Registration Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update block status",
        });
    }
};

