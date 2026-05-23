export function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildInvestorSearchFilter(search, normalizeGender) {
    const trimmed = String(search || "").trim();
    if (!trimmed) return null;

    const orConditions = [
        { Name: { $regex: escapeRegex(trimmed), $options: "i" } },
        { Code_No: { $regex: escapeRegex(trimmed), $options: "i" } },
    ];

    const genderMatch = normalizeGender(trimmed);
    if (genderMatch && trimmed.toLowerCase() === genderMatch.toLowerCase()) {
        return { Gender: genderMatch };
    }

    if (genderMatch) {
        orConditions.push({ Gender: genderMatch });
    }

    const digits = trimmed.replace(/\D/g, "");
    if (digits) {
        orConditions.push({
            $expr: {
                $regexMatch: {
                    input: { $toString: "$Phone_No" },
                    regex: digits,
                },
            },
        });
        if (digits.length === 10) {
            orConditions.push({ Phone_No: Number(digits) });
        }
    }

    if (/^\d+$/.test(trimmed)) {
        orConditions.push({ No: Number(trimmed) });
    }

    return { $or: orConditions };
}
