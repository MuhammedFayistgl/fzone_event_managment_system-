import { formatRegistrationInvestor } from "./resolveRegistrationInvestors.js";

export const VALID_GENDERS = ["Male", "Female", "Other"];

const FEMALE_TOKENS = [
  "fathima",
  "fatima",
  "fathimath",
  "rasheeda",
  "rashida",
  "saleena",
  "kadeeja",
  "khadeeja",
  "kadija",
  "nabeela",
  "nabeesa",
  "jameela",
  "sajna",
  "ramla",
  "ramlath",
  "mihra",
  "shabana",
  "ayisha",
  "aisha",
  "ayishabi",
  "mariam",
  "maryam",
  "haseena",
  "nasreen",
  "beevi",
  "beegam",
  " banu",
  "banu ",
  "hajira",
  "souda",
  "suhara",
  "sakina",
  "sakeena",
  "nadeera",
  "nadheera",
  "habeeba",
  "ummu",
  "umma",
  "mufeeda",
  "farhana",
  "henna",
  "safiya",
  "zubaida",
  "hafsa",
  "ruksana",
  "rukhsana",
  "nafisa",
  "seenath",
  "shareefa",
  "muneera",
  "rafeena",
  "shameera",
  "juvairia",
  "asiya",
  "asna",
  "neema",
  "seena",
  "suhra",
  " ramla",
  "ramla ",
];

const MALE_TOKENS = [
  "abdul",
  "abdu ",
  " abdu",
  "mohammed",
  "muhammad",
  "muhammed",
  "ibrahim",
  "aboobacker",
  "abubacker",
  "hamdan",
  "shamsudheen",
  "shamsuddeen",
  "neehad",
  "ashraf",
  "kunhalan",
  "yahkoob",
  "fazil",
  "musthafa",
  "safvan",
  "mubarak",
  "basith",
  "refeek",
  "aslam",
  "jamsheed",
  "labeeb",
  "kabeer",
  "haris",
  "wasih",
  "thajuddeen",
  "shereef",
  "majeed",
  "hasik",
  "rahiman",
  "muhiyidheen",
  "abdurahiman",
  "musliyar",
  "kunhi",
  "shareef",
  "nabeel ",
  "anees",
  "salam",
  "jaleel",
  "raoof",
  "farook",
  "farooq",
  "haneef",
  "saeed",
  "sidheeq",
  "shafi",
  "shukoor",
  "usman",
  "mansoor",
  "muneer",
  "noushad",
  "shameer",
];

const MALE_FIRST_NAME_SUFFIX_BLOCKLIST = [
  "abdulla",
  "mustafa",
  "hamza",
  "ibraheem",
];

/** Common Malayalam/Muslim name roots — includes frequent spellings and typos */
const FEMALE_NAME_ROOTS = [
  "fathim", "fatim", "rasheeda", "rashida", "saleen", "kadeej", "khadeej", "kadija",
  "nabeela", "nabees", "jameela", "sajna", "ramla", "ramlath", "mihra", "shaban",
  "ayish", "aish", "mariam", "maryam", "haseen", "nasree", "beevi", "beegam", "banu",
  "hajir", "souda", "suhara", "sakina", "sakeen", "nadeera", "nadheer", "habeeba",
  "ummu", "umma", "mufeed", "farhana", "henna", "safiy", "zubaid", "hafsa", "ruksan",
  "nafis", "seenath", "shareefa", "muneera", "rafeena", "shameera", "juvair", "asiya",
  "asna", "neema", "seena", "suhra", "nusrath", "nusra", "ayissa", "noorja", "shahna",
  "rubeena", "suhaila", "haseena", "nasreen", "farsana", "sajitha", "ramsha",
  "sameera", "saneera", "mubashira", "mubassira", "muhsina", "rameesa", "raheema",
  "harifa", "arshada", "jaseela", "sunila", "femina", "irfana", "salima", "swaliha",
  "murshida", "aneena", "raheena", "mubashirath",
];

const MALE_NAME_ROOTS = [
  "abdul", "abdu", "moham", "muham", "aham", "ahmed", "ahmmed", "mammad", "mammed",
  "ibrah", "hamdan", "ashraf", "musth", "musta", "safvan", "mubarak", "basith", "aslam",
  "asslam", "shameer", "shihab", "shahab", "sharaf", "rahman", "rahim", "udheen", "udeen",
  "uddeen", "salam", "noushad", "noufal", "naufal", "mujeeb", "ummer", "umar", "hussain",
  "husain", "khalid", "saleem", "jamal", "shakir", "anvar", "fayiz", "faisal", "sainud",
  "fasal", "mubashir", "shuaib", "bujair", "moidu", "riyas", "rijas", "haneef", "farook",
  "farooq", "jaleel", "majeed", "muneeb", "sidhee", "shamsu", "thajud", "muhiyi", "kunhi",
  "kunhal", "labeeb", "kabeer", "haris", "wasih", "refeek", "jamshe", "mansoor", "usman",
  "musliy", "aboob", "abuba", "neehad", "yahkoo", "fazil", "hasik", "ramshe", "mahamo",
  "sameer", "muthee", "haque", "salah", "enudh", "nabeel", "anees", "saeed", "shafi",
  "shukoor", "shareef", "shereef", "muneer", "kutty", "nafees", "shanoof", "biju",
  "sunil", "jishnu", "jaseem", "jaseer", "jasim", "suhail", "yousuf", "yusuf", "yoosuf",
  "ismail", "basheer", "ameer", "ameen", "adheer", "adhar", "adnan", "akbar", "akram",
  "anas", "arif", "azhar", "bilal", "ghalib", "haaris", "imran", "irfan", "jafar",
  "javeed", "junaid", "kareem", "latheef", "lukman", "mahboob", "majid", "malik", "masud",
  "mazin", "mishal", "moideen", "moidheen", "muhsin", "mukthar", "murshid", "mustafa",
  "nadeem", "najeeb", "nasim", "nazar", "nizar", "rafeeq", "rafeek", "raheem",
  "raoof", "rasheed", "rauf", "sabeer", "sadiq", "sajid", "salim", "samad",
];

function tokenizeName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function matchesNameRoot(name, root) {
  const r = root.trim().toLowerCase();
  if (!r || r.length < 4) return false;

  const words = tokenizeName(name);
  const padded = ` ${words.join(" ")} `;

  if (padded.includes(` ${r} `)) {
    return true;
  }

  for (const word of words) {
    if (word.length < r.length) continue;
    if (word.startsWith(r)) {
      return true;
    }
  }

  return false;
}

function matchNameRoots(name, roots) {
  for (const root of roots) {
    if (matchesNameRoot(name, root)) {
      return root;
    }
  }
  return null;
}

/** Normalize to Male | Female | Other, or null if invalid/missing */
export function normalizeGender(gender) {
  if (!gender || typeof gender !== "string") return null;
  const trimmed = gender.trim();
  const lower = trimmed.toLowerCase();
  if (["male", "m", "boy", "man"].includes(lower)) return "Male";
  if (["female", "f", "girl", "woman"].includes(lower)) return "Female";
  if (["other", "o"].includes(lower)) return "Other";
  const match = VALID_GENDERS.find((g) => g.toLowerCase() === lower);
  return match || null;
}

/**
 * Infer gender from investor/participant name using Malayalam/Muslim name tokens.
 * Returns { gender, matchReason } where matchReason is female_token | male_token | suffix_a | none
 */
export function inferGenderFromName(name) {
  const n = ` ${String(name ?? "").toLowerCase().replace(/[.,]/g, " ")} `;

  for (const token of FEMALE_TOKENS) {
    if (n.includes(token)) {
      return { gender: "Female", matchReason: "female_token" };
    }
  }

  for (const token of MALE_TOKENS) {
    if (n.includes(token)) {
      return { gender: "Male", matchReason: "male_token" };
    }
  }

  const femaleRoot = matchNameRoots(name, FEMALE_NAME_ROOTS);
  if (femaleRoot) {
    return { gender: "Female", matchReason: `female_root:${femaleRoot}` };
  }

  const maleRoot = matchNameRoots(name, MALE_NAME_ROOTS);
  if (maleRoot) {
    return { gender: "Male", matchReason: `male_root:${maleRoot}` };
  }

  const first = String(name ?? "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase() || "";

  if (
    first.length > 3 &&
    first.endsWith("a") &&
    !first.endsWith("ulla") &&
    !first.endsWith("sha") &&
    !MALE_FIRST_NAME_SUFFIX_BLOCKLIST.some((m) => first.includes(m))
  ) {
    return { gender: "Female", matchReason: "suffix_a" };
  }

  return { gender: "Other", matchReason: "none" };
}

/**
 * Resolve investor gender: name inference wins when Male/Female is detected.
 * OAuth and auth flows are untouched — this only applies to investor records.
 *
 * - Strong token matches (exact tokens / suffix_a) always override wrong stored values.
 * - Root-based inference only fills in missing/Other rows — avoids false swaps on existing Male/Female.
 */
export function resolveInvestorGender(name, submittedGender) {
  const submitted = normalizeGender(submittedGender);
  const { gender: inferred, matchReason } = inferGenderFromName(name);

  const isStrongMatch =
    matchReason === "female_token" ||
    matchReason === "male_token" ||
    matchReason === "suffix_a";

  if (isStrongMatch && (inferred === "Male" || inferred === "Female")) {
    return {
      gender: inferred,
      source: "name",
      inferred,
      submitted,
      matchReason,
      corrected: Boolean(submitted && submitted !== inferred),
    };
  }

  if (
    (inferred === "Male" || inferred === "Female") &&
    (!submitted || submitted === "Other")
  ) {
    return {
      gender: inferred,
      source: "name",
      inferred,
      submitted,
      matchReason,
      corrected: submitted === "Other",
    };
  }

  return {
    gender: submitted || "Other",
    source: submitted ? "submitted" : "default",
    inferred,
    submitted,
    matchReason,
    corrected: false,
  };
}

/**
 * Resolve gender on admin update: honor explicit Male/Female picks; infer only for Other/missing.
 */
export function resolveInvestorGenderForUpdate(name, submittedGender) {
  const submitted = normalizeGender(submittedGender);

  if (submitted === "Male" || submitted === "Female") {
    return {
      gender: submitted,
      source: "manual",
      inferred: inferGenderFromName(name).gender,
      submitted,
      matchReason: "manual_override",
      corrected: false,
    };
  }

  return resolveInvestorGender(name, submitted);
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
