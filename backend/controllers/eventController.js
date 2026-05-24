
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

    const processedDays = [];

    for (let i = 0; i < data.eventDays.length; i++) {
      const d = data.eventDays[i];

      if (!d.date || !d.startTime || !d.endTime) {
        return res.status(400).json({
          success: false,
          message: `Invalid event day at index ${i}`
        });
      }

      // ✅ Combine date + time properly
      const start = new Date(`${d.date}T${d.startTime}`);
      let end = new Date(`${d.date}T${d.endTime}`);

      // ❌ Invalid Date check (VERY IMPORTANT)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Invalid date/time format at day ${i + 1}`
        });
      }

      // ✅ Overnight support
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }

      // ❌ Still invalid (safety)
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: `Invalid time range at day ${i + 1}`
        });
      }

      // ❌ Prevent unrealistic duration
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (diffHours > 24) {
        return res.status(400).json({
          success: false,
          message: `Event duration too long (day ${i + 1})`
        });
      }

      processedDays.push({
        date: new Date(d.date),
        startTime: start,
        endTime: end
      });
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
    await eventModel.findByIdAndDelete(id);
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
    if (data.registrationStart && data.registrationDeadline) {
      const regStart = new Date(data.registrationStart);
      const regEnd = new Date(data.registrationDeadline);

      if (regEnd <= regStart) {
        return res.status(400).json({
          success: false,
          message: "Registration deadline must be after start"
        });
      }
    }

    // ================= EVENT DAYS =================
    if (data.eventDays) {
      if (!Array.isArray(data.eventDays) || data.eventDays.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one event day required"
        });
      }

      for (let i = 0; i < data.eventDays.length; i++) {
        const d = data.eventDays[i];

        if (!d.date || !d.startTime || !d.endTime) {
          return res.status(400).json({
            success: false,
            message: `Invalid event day at index ${i}`
          });
        }

        const start = new Date(d.startTime);
        const end = new Date(d.endTime);

        if (end <= start) {
          return res.status(400).json({
            success: false,
            message: `End time must be after start time (day ${i + 1})`
          });
        }
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
        existingEvent.eventDays = data.eventDays.map((d) => ({
          date: new Date(d.date),
          startTime: new Date(d.startTime),
          endTime: new Date(d.endTime)
        }));
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