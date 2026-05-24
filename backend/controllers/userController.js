
import mongoose from "mongoose";
import eventModel from "../models/eventModel.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import Investor from "../models/Investor.js";
import investorsModal from "../models/Investor.js";
import Payment from "../models/paymentModel.js";
import {
  normalizePhone,
  investorPhoneQuery,
  registrationPhoneQuery,
} from "../utils/phone.js";
import { ensureParticipantPasses } from "../utils/passQr.js";
import { sanitizeBlockedReasonForUser } from "../utils/paymentRefund.js";


// controllers/investorController.js

export const checkInvestor = async (req, res) => {
  try {
    const { phone, eventId } = req.body;

    const normalized = normalizePhone(phone);

    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    // ================= INVESTOR FIND =================
    const investor = await investorsModal.findOne(
      investorPhoneQuery(normalized)
    );

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Not an investor",
      });
    }

    // ================= CHECK REGISTRATION =================
    let registrationData = null;

    if (eventId) {
      const existing = await RegEventModel.findOne({
        eventId,
        ...registrationPhoneQuery(normalized),
      });

      if (existing) {
        await ensureParticipantPasses(existing);

        const registrationObject = existing.toObject();
        registrationObject.isBlocked = Boolean(existing.isBlocked);
        registrationObject.blockedReason = existing.isBlocked
          ? sanitizeBlockedReasonForUser(existing.blockedReason)
          : "";
        registrationObject.participants = (registrationObject.participants || []).map(
          (participant) => ({
            ...participant,
            isBlocked: Boolean(participant.isBlocked),
            blockedReason: participant.isBlocked
              ? sanitizeBlockedReasonForUser(participant.blockedReason)
              : "",
          })
        );

        registrationData = {
          registered: true,
          registration: registrationObject,
        };
      }
    }

    // ================= FINAL RESPONSE =================
    return res.json({
      success: true,
      investor,

      // 🔥 NEW FIELD (IMPORTANT)
      ...registrationData,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// ================= GET ONE EVENT BY ID =================
// export const GetOneEventById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // ================= VALIDATION =================
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Event ID is required"
//       });
//     }

//     // ================= CHECK VALID OBJECT ID =================
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Event ID"
//       });
//     }

//     // ================= FIND EVENT =================
//     const event = await eventModel.findById(id);

//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: "Event not found"
//       });
//     }

//     // ================= TOTAL REGISTRATIONS =================
//     const totalRegistrations = await RegEventModel.countDocuments({
//       eventId: id
//     });

//     // ================= TOTAL INVESTORS =================
//     const investors = await RegEventModel.find({ eventId: id })
//       .populate({
//         path: "investorId",
//         model: investorsModal,
//         select: "-password"
//       })
//       .sort({ createdAt: -1 });

//     // ================= PAYMENT DETAILS =================
//     const payments = await Payment.find({ eventId: id }).sort({
//       createdAt: -1
//     });

//     // ================= RESPONSE =================
//     return res.status(200).json({
//       success: true,
//       message: "Event fetched successfully",

//       data: {
//         ...event._doc,

//         registrationCount: totalRegistrations,

//         investors,

//         payments
//       }
//     });
//   } catch (error) {
//     console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };


// ================= GET ONE EVENT DETAILS ONLY =================
export const GetOneEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // ================= VALIDATION =================
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required"
      });
    }

    // ================= CHECK OBJECT ID =================
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Event ID"
      });
    }

    // ================= FIND EVENT =================
    const event = await eventModel.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      message: "Event fetched successfully",
      data: event
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};




// export const checkInverstor = async (req, res) => {
//   try {
//     const { phone, eventId } = req.body;

//     const cleanPhone = Number(String(phone).trim());

//     const investor = await investorsModal.findOne({
//       Phone_No: cleanPhone
//     });

//     if (!investor) {
//       return res.status(404).json({
//         success: false,
//         message: "Investor not found"
//       });
//     }

//     // 🔥 CHECK EXISTING REGISTRATION
//     const existingRegistration = await EventRegistrationModel.findOne({
//       investorId: investor._id,
//       eventId: eventId
//     });

//     res.status(200).json({
//       success: true,
//       data: {
//         investor: {
//           _id: investor._id,
//           name: investor.Name,
//           code: investor.Code_No,
//           phone: investor.Phone_No
//         },
//         registration: existingRegistration || null
//       }
//     });

//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// };