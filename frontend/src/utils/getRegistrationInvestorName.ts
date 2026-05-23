type RegistrationLike = {
    phone?: string | number;
    investorName?: string;
    investor?: {
        Name?: string;
        name?: string;
        Full_Name?: string;
    } | null;
};

export function getRegistrationInvestorName(item: RegistrationLike | null | undefined) {
    const name =
        item?.investor?.Name ||
        item?.investor?.name ||
        item?.investor?.Full_Name ||
        item?.investorName;

    if (name) return name;

    const phone = String(item?.phone ?? "").trim();
    if (phone) return phone;

    return "Unknown";
}

export function getRegistrationInvestorInitial(item: RegistrationLike | null | undefined) {
    const label = getRegistrationInvestorName(item);
    return label.charAt(0).toUpperCase() || "?";
}
