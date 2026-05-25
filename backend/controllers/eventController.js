
import eventModel from "../models/eventModel.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import investorsModal from "../models/Investor.js";
import { deleteTicketBgFiles } from "../utils/ticketBackground.js";
import {
  buildInvestorLookupByPhone,
  repairRegistrationInvestorIds,
  formatRegistrationInvestor,
} from "../utils/resolveRegistrationInvestors.js";
import { applyPricingToPayload, validatePricingPayload } from "../utils/pricing.js";
import { logAuditAction } from "../utils/auditLog.js";
import { createNotification } from "../services/notificationService.js";
import {
  processEventDays,
  getScheduleBounds,
  validateRegistrationWindow,
} from "../utils/eventDays.js";





// ================= CREATE EVENT =================
export const createEvent = async (req, res) => {
  try {
    const data = req.body;

    // ================= BASIC VALIDATION =================
    if (!data.title || data.title.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters"
      });
    }

    if (!data.description || data.description.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Description too short"
      });
    }

    // ================= EVENT DAYS =================
    if (!data.eventDays || data.eventDays.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one event day required"
      });
    }

    const dayResult = processEventDays(data.eventDays);
    if (dayResult.error) {
      return res.status(400).json({ success: false, message: dayResult.error });
    }
    const processedDays = dayResult.days;

    const scheduleBounds = getScheduleBounds(processedDays);
    const regError = validateRegistrationWindow(
      data.registrationStart,
      data.registrationDeadline,
      scheduleBounds
    );
    if (regError) {
      return res.status(400).json({ success: false, message: regError });
    }

    // ================= PAYMENT =================
    Object.assign(data, applyPricingToPayload(data));
    const pricingErrors = validatePricingPayload(data);
    if (pricingErrors.length) {
      return res.status(400).json({ success: false, message: pricingErrors[0] });
    }

    // ================= LOCATION =================
    if (data.locationType === "online") {
      try {
        const url = new URL(data.location);

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error();
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid meeting link"
        });
      }
    }

    // ================= CREATE EVENT =================
    const event = await eventModel.create({
      ...data,
      eventDays: processedDays
    });

    await logAuditAction({
      action: "event.created",
      category: "registration",
      actor: req.user,
      targetType: "event",
      targetId: String(event._id),
      eventId: event._id,
      metadata: { title: event.title },
      req,
    });

    createNotification("event.created", {
      eventId: String(event._id),
      eventTitle: event.title,
      entity: { type: "event", id: String(event._id), eventId: String(event._id) },
      sender: req.user,
    }).catch(() => {});

    // ================= SUCCESS RESPONSE =================
    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: {
        _id: event._id,
        title: event.title,
        description: event.description,
        eventDays: event.eventDays,
        isPaid: event.isPaid,
        price: event.price,
        locationType: event.locationType,
        location: event.location,
        createdAt: event.createdAt
      }
    });

  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error, please try again"
    });
  }
};
export const getAllEvents = async (req, res) => {
  try {
    const events = await eventModel
      .find()
      .sort({ createdAt: -1 }); // 🔥 latest first

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events"
    });
  }
};


export const eventDelete = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTicketBgFiles(id);
    const deleted = await eventModel.findByIdAndDelete(id);
    if (deleted) {
      await logAuditAction({
        action: "event.deleted",
        category: "registration",
        actor: req.user,
        targetType: "event",
        targetId: String(id),
        metadata: { title: deleted.title },
        req,
      });
    }
    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= edit EVENT  ==================

// export const eventEdit = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedEvent = await eventModel.findByIdAndUpdate(id, req.body, { new: true });
//     res.status(200).json({ success: true, message: "Event updated successfully", data: updatedEvent });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


//  ================= UPDATE EVENT  ==================

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;


    const existingEvent = await eventModel.findById(id);

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // ================= BASIC VALIDATION =================
    if (data.title && data.title.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters"
      });
    }

    if (data.description && data.description.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Description too short"
      });
    }

    // ================= REGISTRATION =================
    if (data.eventDays) {
      const dayResult = processEventDays(data.eventDays);
      if (dayResult.error) {
        return res.status(400).json({ success: false, message: dayResult.error });
      }

      const scheduleBounds = getScheduleBounds(dayResult.days);
      const regStart = data.registrationStart ?? existingEvent.registrationStart;
      const regEnd = data.registrationDeadline ?? existingEvent.registrationDeadline;
      const regError = validateRegistrationWindow(regStart, regEnd, scheduleBounds);
      if (regError) {
        return res.status(400).json({ success: false, message: regError });
      }

      data.eventDays = dayResult.days;
    } else {
      const scheduleBounds = getScheduleBounds(existingEvent.eventDays);
      const regStart = data.registrationStart ?? existingEvent.registrationStart;
      const regEnd = data.registrationDeadline ?? existingEvent.registrationDeadline;
      const regError = validateRegistrationWindow(regStart, regEnd, scheduleBounds);
      if (regError) {
        return res.status(400).json({ success: false, message: regError });
      }
    }

    // ================= PAYMENT =================
    if (data.isPaid !== undefined || data.investorPrice !== undefined || data.guestPrice !== undefined) {
      const merged = applyPricingToPayload({ ...existingEvent.toObject(), ...data });
      Object.assign(data, merged);
      const pricingErrors = validatePricingPayload(merged);
      if (pricingErrors.length) {
        return res.status(400).json({ success: false, message: pricingErrors[0] });
      }
    }

    // ================= LOCATION =================
    if (data.locationType === "online" && data.location) {
      if (!data.location.includes("http")) {
        return res.status(400).json({
          success: false,
          message: "Invalid meeting link"
        });
      }
    }

    // ================= UPDATE =================
    Object.keys(data).forEach((key) => {
      if (key === "eventDays") {
        existingEvent.eventDays = data.eventDays;
      } else if (key === "ticketDesign" && data.ticketDesign) {
        existingEvent.ticketDesign = {
          ...existingEvent.ticketDesign?.toObject?.() ?? existingEvent.ticketDesign ?? {},
          ...data.ticketDesign,
        };
      } else {
        existingEvent[key] = data[key];
      }
    });

    const updatedEvent = await existingEvent.save();

    await logAuditAction({
      action: "event.updated",
      category: "registration",
      actor: req.user,
      targetType: "event",
      targetId: String(updatedEvent._id),
      eventId: updatedEvent._id,
      metadata: { title: updatedEvent.title },
      req,
    });

    createNotification("event.updated", {
      eventId: String(updatedEvent._id),
      eventTitle: updatedEvent.title,
      entity: { type: "event", id: String(updatedEvent._id), eventId: String(updatedEvent._id) },
      sender: req.user,
    }).catch(() => {});

    // ================= SUCCESS =================
    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: {
        _id: updatedEvent._id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        registrationStart: updatedEvent.registrationStart,
        registrationDeadline: updatedEvent.registrationDeadline,
        eventDays: updatedEvent.eventDays,
        isPaid: updatedEvent.isPaid,
        price: updatedEvent.price,
        locationType: updatedEvent.locationType,
        location: updatedEvent.location,
        createdAt: updatedEvent.createdAt
      }
    });

  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error, please try again"
    });
  }
};





export const getDashboardEventsWithRegistrations = async (req, res) => {
  try {
    const now = Date.now();

    const events = await eventModel
      .find({ "eventDays.0": { $exists: true } })
      .select("title description location eventDays createdAt isRegistrationClosed isPaid price investorIsFree investorPrice guestPaymentEnabled guestPrice freeGuestCount allowGuests maxPerUser locationType ticketDesign")
      .lean();

    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        counts: { upcoming: 0, running: 0, past: 0 },
        data: { upcoming: [], running: [], past: [] },
      });
    }

    const classified = { upcoming: [], running: [], past: [] };

    for (const event of events) {
      const sortedByStart = [...event.eventDays].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      const sortedByEnd = [...event.eventDays].sort(
        (a, b) =>
          new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
      );

      const startTime = new Date(sortedByStart[0].startTime).getTime();
      const endTime = new Date(sortedByEnd[0].endTime).getTime();

      let status;
      if (now < startTime) status = "upcoming";
      else if (now <= endTime) status = "running";
      else status = "ended";

      classified[
        status === "upcoming" ? "upcoming" : status === "running" ? "running" : "past"
      ].push({
        event,
        startTime,
        endTime,
        status,
      });
    }

    const allIds = events.map((e) => e._id);

    const registrations = await RegEventModel.find({
      eventId: { $in: allIds },
    })
      .populate({
        path: "investorId",
        select: "Name Phone_No Code_No",
      })
      .select("eventId phone participants createdAt investorId")
      .lean();

    const investorByPhone = await buildInvestorLookupByPhone(
      registrations.map((reg) => reg.phone)
    );
    await repairRegistrationInvestorIds(registrations, investorByPhone);

    const grouped = {};
    for (const reg of registrations) {
      const key = reg.eventId.toString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        _id: reg._id,
        phone: reg.phone,
        participants: reg.participants,
        createdAt: reg.createdAt,
        investor: (() => {
          const resolved = formatRegistrationInvestor(reg, investorByPhone);
          return resolved
            ? {
                name: resolved.Name,
                phone: resolved.Phone_No,
                code: resolved.Code_No,
              }
            : null;
        })(),
      });
    }

    const enrich = ({ event, startTime, endTime, status }) => {
      const regs = grouped[event._id.toString()] || [];
      return {
        ...event,
        registrations: regs,
        totalRegistrations: regs.length,
        startTime,
        endTime,
        daysLeft: Math.ceil((startTime - now) / (1000 * 60 * 60 * 24)),
        status,
      };
    };

    const upcoming = classified.upcoming.map(enrich).sort((a, b) => a.startTime - b.startTime);
    const running = classified.running.map(enrich).sort((a, b) => a.startTime - b.startTime);
    const past = classified.past.map(enrich).sort((a, b) => b.endTime - a.endTime);

    return res.status(200).json({
      success: true,
      counts: {
        upcoming: upcoming.length,
        running: running.length,
        past: past.length,
      },
      data: { upcoming, running, past },
    });
  } catch (error) {
    console.error("DASHBOARD EVENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/** @deprecated use getDashboardEventsWithRegistrations — kept for route alias */
export const getUpcomingEventsWithRegistrations = getDashboardEventsWithRegistrations;