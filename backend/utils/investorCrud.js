import mongoose from "mongoose";
import {
  normalizeGender,
  resolveInvestorGender,
  resolveInvestorGenderForUpdate,
} from "./gender.js";

export function parseInvestorObjectId(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    return null;
  }
  return new mongoose.Types.ObjectId(String(id));
}

export function normalizeInvestorPhone(raw) {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) {
    return { ok: false, message: "Phone must be a valid 10-digit number" };
  }

  const phoneNumber = Number(digits);
  if (!Number.isFinite(phoneNumber)) {
    return { ok: false, message: "Invalid phone number" };
  }

  return { ok: true, phoneNumber, phoneDigits: digits };
}

export function prepareInvestorCreateInput(body) {
  const Code_No = String(body?.Code_No ?? "").trim().toUpperCase();
  const Name = String(body?.Name ?? "").trim();
  const phone = normalizeInvestorPhone(body?.Phone_No);

  if (!phone.ok) {
    return { ok: false, message: phone.message };
  }
  if (!Code_No || !Name) {
    return {
      ok: false,
      message: "All fields are required (Code, Name, Phone)",
    };
  }

  const genderResolution = resolveInvestorGender(Name, body?.Gender);

  return {
    ok: true,
    fields: {
      Code_No,
      Name,
      Phone_No: phone.phoneNumber,
      Gender: genderResolution.gender,
    },
    genderResolution,
  };
}

export function prepareInvestorUpdateInput(body) {
  const Code_No = String(body?.Code_No ?? "").trim().toUpperCase();
  const Name = String(body?.Name ?? "").trim();
  const phone = normalizeInvestorPhone(body?.Phone_No);

  if (!phone.ok) {
    return { ok: false, message: phone.message };
  }
  if (!Code_No || !Name) {
    return {
      ok: false,
      message: "All fields are required (Code, Name, Phone)",
    };
  }

  const genderResolution = resolveInvestorGenderForUpdate(Name, body?.Gender);

  return {
    ok: true,
    fields: {
      Code_No,
      Name,
      Phone_No: phone.phoneNumber,
      Gender: genderResolution.gender,
    },
    genderResolution,
  };
}

export function buildInvestorDuplicateFilter({ code, phoneNumber, excludeId }) {
  const filter = {
    $or: [{ Code_No: code }, { Phone_No: phoneNumber }],
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return filter;
}

export async function findInvestorDuplicate(model, { code, phoneNumber, excludeId }) {
  const existing = await model
    .findOne(buildInvestorDuplicateFilter({ code, phoneNumber, excludeId }))
    .select("Code_No Phone_No")
    .lean();

  if (!existing) {
    return null;
  }

  if (existing.Code_No === code) {
    return { field: "Code_No", message: "Investor code already exists" };
  }

  return { field: "Phone_No", message: "Phone number already exists" };
}

export { normalizeGender };
