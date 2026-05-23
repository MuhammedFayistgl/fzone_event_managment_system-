
import eventModel from "../models/eventModel.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import Payment from "../models/paymentModel.js";
import investorsModal from "../models/Investor.js";
import {
  normalizePhone,
  investorPhoneQuery,
  registrationPhoneQuery,
} from "../utils/phone.js";
import {
  buildInvestorLookupByPhone,
  formatRegistrationInvestor,
  repairRegistrationInvestorIds,
} from "../utils/resolveRegistrationInvestors.js";

import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";


export const registerEvent = async (req, res) => {
  try {
    const { phone, eventId, guests = [] } = req.body;

    // ================= 1. VALIDATION =================
    if (!phone || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Phone and Event ID required",
      });
    }

    const normalized = normalizePhone(phone);

    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    const phoneKey = normalized.string;

    // ================= 2. GET EVENT =================
    const event = await eventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // ================= 3. CHECK EVENT CLOSED =================
    const now = new Date();

    const isClosed =
      event.isRegistrationClosed ||
      event.eventDays.every((d) => new Date(d.endTime) < now);

    if (isClosed) {
      return res.status(400).json({
        success: false,
        message: "Event registration closed",
      });
    }

    // ================= 4. CHECK PAYMENT =================
    let payment = null;

    if (event.isPaid) {
      payment = await Payment.findOne({
        eventId,
        phone: phoneKey,
        status: "success",
      });

      if (!payment) {
        return res.status(400).json({
          success: false,
          message: "Payment not completed",
        });
      }
    }

    // ================= 5. CHECK EXISTING =================
    const existing = await RegEventModel.findOne({
      eventId,
      ...registrationPhoneQuery(normalized),
    });

    // ================= 6. GET INVESTOR =================
    const investor = await investorsModal.findOne(
      investorPhoneQuery(normalized)
    );

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found",
      });
    }

    // ================= 7. GUEST VALIDATION =================
    if (event.allowGuests) {
      if (guests.length > (event.maxPerUser ?? 0)) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${event.maxPerUser} guests allowed`,
        });
      }

      const invalidGuest = guests.some(
        (g) =>
          !g.name ||
          (g.phone && !/^\d{10}$/.test(g.phone))
      );

      if (invalidGuest) {
        return res.status(400).json({
          success: false,
          message: "Invalid guest details",
        });
      }
    }

    // ================= 8. TRANSFORM GUESTS =================
    const participants = guests.map((g) => ({
      name: g.name.trim(),
      type: g.category || "guest",
    }));

    // ================= 9. SORT FOR CONSISTENT COMPARISON =================
    const normalize = (data) =>
      JSON.stringify(
        [...data].sort((a, b) => a.name.localeCompare(b.name))
      );

    // ================= 10. HANDLE EXISTING =================
    if (existing) {

      // ===== KEEP OLD PARTICIPANTS =====

      const oldParticipants =
        existing.participants || [];

      // ===== NEW PARTICIPANTS =====

      const newParticipants =
        participants || [];

      // ===== MERGE BOTH =====

      let finalParticipants = [
        ...oldParticipants,
        ...newParticipants,
      ];

      // ===== REMOVE DUPLICATES =====

      finalParticipants =
        finalParticipants.filter(
          (guest, index, self) =>
            index ===
            self.findIndex(
              (g) =>
                g.name.trim().toLowerCase() ===
                guest.name.trim().toLowerCase() &&
                g.type === guest.type
            )
        );

      // ===== MAX LIMIT CHECK =====
      if (
        finalParticipants.length > (event.maxPerUser ?? 0)
      ) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${event.maxPerUser} guests allowed`,
        });
      }

      const oldData = normalize(existing.participants || []);
      const newData = normalize(finalParticipants || []);

      // ===== SAME DATA =====
      if (oldData === newData) {
        return res.json({
          eventId,
          success: true,
          message: "Already registered",
          investor,
          qr: existing.qrCodeImage,
          token: existing.qrToken,
          participants: existing.participants,
          registration: existing
        });
      }

      // ===== UPDATE =====
      const updated = await RegEventModel.findByIdAndUpdate(
        existing._id,
        {
          participants: finalParticipants,
          investorId: investor._id,
          investorName: investor.Name,
          investorCode: investor.Code_No,
        },
        { new: true }
      );

      return res.json({
        eventId,
        success: true,
        message: "Registration updated successfully",
        qr: updated.qrCodeImage,
        token: updated.qrToken,
        investor,
        participants: updated.participants,
        registration: updated,
      });
    }

    // ================= 11. GENERATE QR =================
    const qrToken = uuidv4();

    const qrData = JSON.stringify({
      token: qrToken,
      eventId,
    });

    const qrCodeImage = await QRCode.toDataURL(qrData);

    // ================= 12. SAVE =================
    const registration = await RegEventModel.create({
      eventId,
      investorId: investor._id,
      phone: phoneKey,
      investorName: investor.Name,
      investorCode: investor.Code_No,
      participants,

      qrToken,
      qrCodeImage,
      isCheckedIn: false,
      checkedInAt: null,
    });

    return res.json({
      eventId,
      success: true,
      message: "Registration successful",
      qr: qrCodeImage,
      token: qrToken,
      investor,
      participants,
      registration: registration,
    });

  } catch (err) {
    console.error("REGISTER EVENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export const deleteGuestFromRegistration = async (req, res) => {
  try {
    const { registrationId, guestIndex, phone } = req.body;

    // ================= VALIDATION =================
    if (
      registrationId === undefined ||
      guestIndex === undefined ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message: "registrationId, guestIndex, and phone required",
      });
    }

    const normalized = normalizePhone(phone);

    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    // ================= GET REGISTRATION =================
    const registration = await RegEventModel.findById(
      registrationId
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const regPhone = String(registration.phone).replace(/\D/g, "");

    if (regPhone !== normalized.string) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this registration",
      });
    }

    // ================= REMOVE GUEST =================
    const updatedParticipants =
      registration.participants.filter(
        (_, index) => index !== guestIndex
      );

    registration.participants = updatedParticipants;

    await registration.save();

    return res.json({
      success: true,
      message: "Guest deleted successfully",
      participants: registration.participants,
    });

  } catch (err) {
    console.error("DELETE GUEST ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};





// export const registerEvent = async (req, res) => {

//   try {
//     const { phone, eventId, guests = [] } = req.body;

//     // ================= 1. VALIDATION =================
//     if (!phone || !eventId) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone and Event ID required",
//       });
//     }

//     // ================= 2. CHECK PAYMENT =================
//     const payment = await Payment.findOne({
//       eventId,
//       phone,
//       status: "success",
//     });

//     if (!payment) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment not completed",
//       });
//     }

//     // ================= 3. PREVENT DUPLICATE =================
//     const existing = await RegEventModel.findOne({ eventId, phone });

//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: "Already registered",
//       });
//     }

//     // ================= 4. GET INVESTOR =================
//     const investor = await investorsModal.findOne({ Phone_No: phone });

//     if (!investor) {
//       return res.status(404).json({
//         success: false,
//         message: "Investor not found",
//       });
//     }

//     // ================= 5. TRANSFORM GUESTS =================
//     const participants = guests.map((g) => ({
//       name: g.name,
//       type: g.category || "guest",
//     }));


//     // ================= 🔥 6. QR TOKEN GENERATION =================
//     const qrToken = uuidv4(); // unique secure token

//     // ================= 🔥 7. GENERATE QR IMAGE =================
//     const qrData = JSON.stringify({
//       token: qrToken,
//       eventId,
//     });

//     const qrCodeImage = await QRCode.toDataURL(qrData);

//     // ================= 🔥 8. SAVE =================
//     const registration = await RegEventModel.create({
//       eventId,
//       investorId: investor._id,
//       phone,
//       participants,

//       // 🔥 NEW FIELDS (add in schema)
//       qrToken,
//       qrCodeImage,
//       isCheckedIn: false,
//       checkedInAt: null,
//     });

//     return res.json({
//       success: true,
//       message: "Registration successful",

//       // 🔥 return QR
//       qr: qrCodeImage,
//       token: qrToken,
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message || "Server error",
//     });
//   }
// };



// 🔹 CHECK REGISTRATION STATUS
export const checkRegistrationStatus = async (req, res) => {
  try {
    const { eventId, phone } = req.body;

    if (!eventId || !phone) {
      return res.status(400).json({
        success: false,
        message: "eventId and phone required",
      });
    }

    const normalized = normalizePhone(phone);

    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    const existing = await RegEventModel.findOne({
      eventId,
      ...registrationPhoneQuery(normalized),
    });

    if (existing) {
      return res.json({
        success: true,
        registered: true,
        data: existing,
      });
    }

    return res.json({
      success: true,
      registered: false,
    });

  } catch (err) {
    console.error("Check Registration Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




export const verifyQR = async (req, res) => {

  try {

    const {
      token,
      gateName,
      checkInDevice,
      adminId,
    } = req.body;
   
    // ================= VALIDATION =================

    if (!token) {

      return res.status(400).json({
        success: false,
        message: "QR token required",
      });

    }

    // ================= FIND REGISTRATION =================

    const registration =
      await RegEventModel
        .findOne({ qrToken: token })
        .populate("investorId")
        .populate("eventId");

    if (!registration) {

      return res.status(404).json({
        success: false,
        message: "Invalid QR Code",
      });

    }

    const investorByPhone = await buildInvestorLookupByPhone([registration.phone]);
    await repairRegistrationInvestorIds(
      [registration.toObject ? registration.toObject() : registration],
      investorByPhone
    );

    const resolvedInvestor = formatRegistrationInvestor(
      {
        ...registration.toObject(),
        investorId: registration.investorId,
        phone: registration.phone,
        investorName: registration.investorName,
        investorCode: registration.investorCode,
      },
      investorByPhone
    );

    // ================= ALREADY CHECKED IN =================

    if (registration.isCheckedIn) {

      return res.status(400).json({

        success: false,

        alreadyCheckedIn: true,

        message: "Already Checked In",

        data: {

          checkedInAt:
            registration.checkedInAt,

          gateName:
            registration.gateName,

        }

      });

    }

    // ================= UPDATE CHECK-IN =================

    registration.isCheckedIn = true;

    registration.checkedInAt =
      new Date();

    registration.checkedInBy =
      req.user?.id || adminId || null;

    registration.checkInDevice =
      checkInDevice || "Unknown Device";

    registration.gateName =
      gateName || "Main Gate";

    await registration.save();

    // ================= RESPONSE =================

    return res.json({

      success: true,

      message: "Check-In Successful",

      data: {

        registrationId:
          registration._id,

        event:
          registration.eventId,

        investor:
          resolvedInvestor,

        phone:
          registration.phone,

        participants:
          registration.participants,

        checkedInAt:
          registration.checkedInAt,

        gateName:
          registration.gateName,

      }

    });

  } catch (err) {

    console.error(
      "VERIFY QR ERROR:",
      err
    );

    return res.status(500).json({

      success: false,

      message:
        err.message ||
        "Verification failed",

    });

  }

};

// PATCH /event/:id/close-registration

export const closeRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    const event = await eventModel.findByIdAndUpdate(
      id,
      { isRegistrationClosed: true },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.json({
      success: true,
      message: "Registration closed",
      data: event,
    });
  } catch (err) {
    console.error("Close registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};