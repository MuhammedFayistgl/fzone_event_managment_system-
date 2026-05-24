import mongoose from "mongoose";
import eventModel from "../models/eventModel.js";
import Investor from "../models/Investor.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import Payment from "../models/paymentModel.js";
import { registerEvent } from "../controllers/registrationController.js";
import { registrationDetails } from "../controllers/adminController.js";

const EVENT_ID = "69f04c9a984bed46555ca977";

const mockRes = () => {
    let body = null;
    let statusCode = 200;
    return {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            body = data;
            return data;
        },
        getBody: () => body,
        getStatus: () => statusCode,
    };
};

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fzone");

const investor = await Investor.findOne({ Phone_No: 7736121247 }).select("Name Phone_No").lean();
const event = await eventModel.findById(EVENT_ID).lean();
const phone = String(investor.Phone_No);

await RegEventModel.deleteMany({ eventId: EVENT_ID, phone });
await Payment.deleteMany({ eventId: EVENT_ID, phone });

await Payment.create({
    eventId: EVENT_ID,
    phone,
    razorpay_order_id: `test_order_${Date.now()}`,
    razorpay_payment_id: `test_pay_${Date.now()}`,
    amount: event.investorPrice || event.price || 100,
    guestCount: 0,
    status: "success",
});

const registerRes = mockRes();
await registerEvent(
    { body: { phone, eventId: EVENT_ID, guests: [] } },
    registerRes
);

const detailsRes = mockRes();
await registrationDetails({ body: { id: EVENT_ID } }, detailsRes);

const apiReg = detailsRes.getBody()?.data?.registrations?.find(
    (item) => String(item.phone) === phone
);

const payload = {
    registerStatus: registerRes.getStatus(),
    registerMessage: registerRes.getBody()?.message,
    expectedName: investor.Name,
    apiInvestorName: apiReg?.investor?.Name || null,
    apiStoredName: apiReg?.investorName || null,
    fixWorks: apiReg?.investor?.Name === investor.Name,
};

console.log(JSON.stringify(payload, null, 2));

await mongoose.disconnect();
