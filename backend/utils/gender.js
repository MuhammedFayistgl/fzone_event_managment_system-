import { formatRegistrationInvestor } from "./resolveRegistrationInvestors.js";

export const VALID_GENDERS = ["Male", "Female", "Other"];

/** Normalize to Male | Female | Other, or null if invalid/missing */
export function normalizeGender(gender) {
  if (!gender || typeof gender !== "string") return null;
  const trimmed = gender.trim();
  const match = VALID_GENDERS.find(
    (g) => g.toLowerCase() === trimmed.toLowerCase()
  );
  return match || null;
}

/** For stats / legacy rows without gender */
export function genderForStats(gender) {
  return normalizeGender(gender) || "Other";
}

/** Count { Male, Female, Other } from an array of gender strings */
export function countByGender(genders) {
  const counts = { Male: 0, Female: 0, Other: 0 };
  for (const g of genders) {
    const key = genderForStats(g);
    counts[key] += 1;
  }
  return counts;
}

/** Build genderBreakdown for event registration statistics */
export function buildRegistrationGenderBreakdown(registrations, investorByPhone) {
  const investorGenders = [];
  const guestGenders = [];

  for (const reg of registrations) {
    const investor = formatRegistrationInvestor(reg, investorByPhone);
    investorGenders.push(investor?.Gender);

    for (const p of reg.participants || []) {
      guestGenders.push(p.gender);
    }
  }

  const investors = countByGender(investorGenders);
  const guests = countByGender(guestGenders);

  return {
    investors: {
      male: investors.Male,
      female: investors.Female,
      other: investors.Other,
    },
    guests: {
      male: guests.Male,
      female: guests.Female,
      other: guests.Other,
    },
    total: {
      male: investors.Male + guests.Male,
      female: investors.Female + guests.Female,
      other: investors.Other + guests.Other,
    },
    totalHeadcount: registrations.length + guestGenders.length,
  };
}

/** Aggregate guest gender counts across all registrations (dashboard) */
export function aggregateGuestGenderFromPipeline() {
  return [
    { $unwind: { path: "$participants", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: { $ifNull: ["$participants.gender", "Other"] },
        count: { $sum: 1 },
      },
    },
  ];
}

export function guestCountsFromAgg(rows) {
  const map = rows.reduce((acc, item) => {
    const key = genderForStats(item._id);
    acc[key] = (acc[key] || 0) + item.count;
    return acc;
  }, {});
  return {
    guestMaleCount: map.Male || 0,
    guestFemaleCount: map.Female || 0,
    guestOtherCount: map.Other || 0,
  };
}
