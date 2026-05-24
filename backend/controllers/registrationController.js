
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
import { normalizeGender } from "../utils/gender.js";
import {
  ensureParticipantPasses,
  findPassByToken,
} from "../utils/passQr.js";
import { calculateRegistrationTotal, sumSuccessfulPayments } from "../utils/pricing.js";
import {
  emitCheckInUpdated,
  emitRegistrationCreated,
} from "../live/liveHub.js";
import { notifyDashboardMetricsChanged } from "../utils/dashboardCache.js";
import { getOrgSettings } from "../utils/appSettings.js";
import WaitlistEntry from "../models/waitlistModel.js";
import { syncAccessAfterRefund } from "../utils/paymentRefund.js";
import { notifyUser } from "../utils/notifications.js";



async function assertPaymentCoversGuests(event, eventId, phoneKey, guestCount) {
  const { total } = calculateRegistrationTotal(event, guestCount);
  if (total <= 0) return null;
  const successPayments = await Payment.find({ eventId, phone: phoneKey, status: "success" });
  const paidTotal = sumSuccessfulPayments(successPayments);
  if (paidTotal < total) {
    return { ok: false, required: total, paid: paidTotal };
  }
  return { ok: true, payment: successPayments[successPayments.length - 1] };
}

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

    // ================= 4. CHECK PAYMENT (after guest count known) =================
    let payment = null;

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

    const settings = await getOrgSettings();

    // ================= 7. GUEST VALIDATION =================
    if (event.allowGuests) {
      if (guests.length > (event.maxPerUser ?? 0)) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${event.maxPerUser} guests allowed`,
        });
      }

      const invalidGuest = guests.some((g) => {
        if (!g.name?.trim()) return true;
        if (!normalizeGender(g.gender)) return true;
        if (g.phone && !/^\d{10}$/.test(String(g.phone))) return true;
        return false;
      });

      if (invalidGuest) {
        return res.status(400).json({
          success: false,
          message: "Invalid guest details — name and gender required",
        });
      }
    }

    // ================= 8. TRANSFORM GUESTS =================
    const participants = guests.map((g) => ({
      name: g.name.trim(),
      phone: g.phone ? String(g.phone).trim() : "",
      type: g.category || g.relation || "guest",
      gender: normalizeGender(g.gender) || "Other",
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

      const paymentCheck = await assertPaymentCoversGuests(
        event,
        eventId,
        phoneKey,
        finalParticipants.length
      );
      if (paymentCheck && !paymentCheck.ok) {
        return res.status(400).json({
          success: false,
          message: "Payment not completed for current guest count",
          requiredTotal: paymentCheck.required,
          paidTotal: paymentCheck.paid,
        });
      }
      payment = paymentCheck?.payment ?? null;

      const oldData = normalize(existing.participants || []);
      const newData = normalize(finalParticipants || []);

      // ===== SAME DATA =====
      if (oldData === newData) {
        await ensureParticipantPasses(existing);

        return res.json({
          eventId,
          success: true,
          message: "Already registered",
          investor,
          qr: existing.qrCodeImage,
          token: existing.qrToken,
          participants: existing.participants,
          registration: existing,
        });
      }

      // ===== UPDATE =====
      existing.participants = finalParticipants;
      existing.investorId = investor._id;
      existing.investorName = investor.Name;
      existing.investorCode = investor.Code_No;
      existing.markModified("participants");

      await ensureParticipantPasses(existing);
      await existing.save();

      return res.json({
        eventId,
        success: true,
        message: "Registration updated successfully",
        qr: existing.qrCodeImage,
        token: existing.qrToken,
        investor,
        participants: existing.participants,
        registration: existing,
      });
    }

    if (!existing && event.maxParticipants > 0) {
      const currentCount = await RegEventModel.countDocuments({ eventId });
      if (currentCount >= event.maxParticipants) {
        if (settings.waitlistEnabled) {
          await WaitlistEntry.findOneAndUpdate(
            { eventId, phone: phoneKey },
            {
              $set: {
                investorName: investor.Name || "",
                guestCount: participants.length,
                status: "waiting",
              },
            },
            { upsert: true, new: true }
          );

          return res.status(202).json({
            success: true,
            waitlisted: true,
            message: "Event is full. You have been added to the waitlist.",
          });
        }

        return res.status(409).json({
          success: false,
          message: "Event has reached maximum capacity",
        });
      }
    }

    const newRegPaymentCheck = await assertPaymentCoversGuests(
      event,
      eventId,
      phoneKey,
      participants.length
    );
    if (newRegPaymentCheck && !newRegPaymentCheck.ok) {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        requiredTotal: newRegPaymentCheck.required,
        paidTotal: newRegPaymentCheck.paid,
      });
    }
    payment = newRegPaymentCheck?.payment ?? null;

    // ================= 11. SAVE REGISTRATION + GENERATE PASSES =================
    const registration = await RegEventModel.create({
      eventId,
      investorId: investor._id,
      phone: phoneKey,
      investorName: investor.Name,
      investorCode: investor.Code_No,
      participants,
      isCheckedIn: false,
      checkedInAt: null,
    });

    await ensureParticipantPasses(registration);

    emitRegistrationCreated({
      eventId: String(eventId),
      registrationId: String(registration._id),
      phone: phoneKey,
    });

    await notifyDashboardMetricsChanged();

    notifyUser({
      phone: phoneKey,
      email: investor?.Email || "",
      eventTitle: event.title,
      template: "pass_ready",
      message: `Your registration for ${event.title} is confirmed. Your digital entry pass is ready.`,
    }).catch(() => {});

    return res.json({
      eventId,
      success: true,
      message: "Registration successful",
      qr: registration.qrCodeImage,
      token: registration.qrToken,
      investor,
      participants: registration.participants,
      registration,
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
    registration.markModified("participants");

    await registration.save();
    await syncAccessAfterRefund(registration.eventId, registration.phone);

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
      await ensureParticipantPasses(existing);

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
        .findOne({
          $or: [
            { qrToken: token },
            { "participants.qrToken": token },
          ],
        })
        .populate("investorId")
        .populate("eventId");

    if (!registration) {

      return res.status(404).json({
        success: false,
        message: "Invalid QR Code",
      });

    }

    const passMatch = findPassByToken(registration, token);

    if (!passMatch) {
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

    const linkedInvestor = {
      name: resolvedInvestor?.Name || registration.investorName,
      code: resolvedInvestor?.Code_No || registration.investorCode,
      phone: registration.phone,
      no: resolvedInvestor?.No,
    };

    const isInvestorPass = passMatch.passType === "investor";
    const guestParticipant = !isInvestorPass
      ? registration.participants[passMatch.participantIndex]
      : null;

    const alreadyCheckedIn = isInvestorPass
      ? registration.isCheckedIn
      : Boolean(guestParticipant?.isCheckedIn);

    const isBlockedPass = isInvestorPass
      ? Boolean(registration.isBlocked)
      : Boolean(guestParticipant?.isBlocked);

    if (isBlockedPass) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: isInvestorPass
          ? "Investor entry is blocked for this event"
          : "Guest entry is blocked for this event",
        data: {
          passType: passMatch.passType,
          holderName: isInvestorPass
            ? linkedInvestor.name
            : guestParticipant?.name,
          blockedReason: isInvestorPass
            ? registration.blockedReason
            : guestParticipant?.blockedReason,
        },
      });
    }

    const checkedInAtValue = isInvestorPass
      ? registration.checkedInAt
      : guestParticipant?.checkedInAt;

    // ================= ALREADY CHECKED IN =================

    if (alreadyCheckedIn) {

      return res.status(400).json({

        success: false,

        alreadyCheckedIn: true,

        message: "Already Checked In",

        data: {

          passType: passMatch.passType,

          holderName: isInvestorPass
            ? linkedInvestor.name
            : guestParticipant?.name,

          guest: guestParticipant
            ? {
                name: guestParticipant.name,
                type: guestParticipant.type,
                gender: guestParticipant.gender,
                phone: guestParticipant.phone,
              }
            : null,

          linkedInvestor,

          checkedInAt: checkedInAtValue,

          gateName: registration.gateName,

        }

      });

    }

    // ================= UPDATE CHECK-IN =================

    const now = new Date();

    if (isInvestorPass) {
      registration.isCheckedIn = true;
      registration.checkedInAt = now;
    } else if (guestParticipant) {
      guestParticipant.isCheckedIn = true;
      guestParticipant.checkedInAt = now;
    }

    registration.checkedInBy =
      req.user?.id || adminId || null;

    registration.checkInDevice =
      checkInDevice || "Unknown Device";

    registration.gateName =
      gateName || "Main Gate";

    await registration.save();

    emitCheckInUpdated({
      eventId: String(registration.eventId?._id || registration.eventId),
      registrationId: String(registration._id),
      phone: registration.phone,
      passType: passMatch.passType,
      participantId: guestParticipant?._id
        ? String(guestParticipant._id)
        : null,
      participantIndex: !isInvestorPass ? passMatch.participantIndex : null,
      isCheckedIn: true,
      checkedInAt: now.toISOString(),
      holderName: isInvestorPass
        ? linkedInvestor.name
        : guestParticipant?.name,
      gateName: registration.gateName,
    });

    await notifyDashboardMetricsChanged();

    // ================= RESPONSE =================

    return res.json({

      success: true,

      message: "Check-In Successful",

      data: {

        passType: passMatch.passType,

        holderName: isInvestorPass
          ? linkedInvestor.name
          : guestParticipant?.name,

        guest: guestParticipant
          ? {
              name: guestParticipant.name,
              type: guestParticipant.type,
              gender: guestParticipant.gender,
              phone: guestParticipant.phone,
            }
          : null,

        linkedInvestor,

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

        checkedInAt: now,

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