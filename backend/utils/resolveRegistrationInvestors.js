import Investor from "../models/Investor.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import { normalizePhone } from "./phone.js";

const INVESTOR_SELECT =
    "No Code_No Name Phone_No Gender role createdAt updatedAt";

export async function buildInvestorLookupByPhone(phones) {
    const numbers = new Set();
    const strings = new Set();

    for (const phone of phones) {
        const normalized = normalizePhone(phone);
        if (!normalized.valid) continue;
        numbers.add(normalized.number);
        strings.add(normalized.string);
    }

    if (numbers.size === 0 && strings.size === 0) {
        return new Map();
    }

    const investors = await Investor.find({
        $or: [
            { Phone_No: { $in: [...numbers] } },
            { Phone_No: { $in: [...strings] } },
        ],
    })
        .select(INVESTOR_SELECT)
        .lean();

    const byPhone = new Map();
    for (const investor of investors) {
        const key = String(investor.Phone_No).replace(/\D/g, "");
        byPhone.set(key, investor);
    }

    return byPhone;
}

export function resolveInvestorFromRegistration(registration, byPhone) {
    if (!registration) return null;

    const populated = registration.investorId;

    if (populated && typeof populated === "object" && populated.Name) {
        return populated;
    }

    const key = String(registration.phone || "").replace(/\D/g, "");
    return byPhone.get(key) || null;
}

export function formatRegistrationInvestor(registration, byPhone) {
    if (!registration) return null;

    const resolved = resolveInvestorFromRegistration(registration, byPhone);
    if (resolved) return resolved;

    if (registration.investorName) {
        return {
            Name: registration.investorName,
            Code_No: registration.investorCode || "",
            Phone_No: registration.phone,
        };
    }

    return null;
}

export async function repairRegistrationInvestorIds(registrations, byPhone) {
    const bulk = [];

    for (const registration of registrations) {
        const populated = registration.investorId;
        const hasValidRef =
            populated &&
            typeof populated === "object" &&
            populated._id &&
            populated.Name;

        if (hasValidRef) continue;

        const key = String(registration.phone || "").replace(/\D/g, "");
        const investor = byPhone.get(key);

        if (investor?._id) {
            bulk.push({
                updateOne: {
                    filter: { _id: registration._id },
                    update: {
                        $set: {
                            investorId: investor._id,
                            investorName: investor.Name,
                            investorCode: investor.Code_No,
                        },
                    },
                },
            });
        }
    }

    if (bulk.length > 0) {
        await RegEventModel.bulkWrite(bulk);
    }

    return bulk.length;
}
