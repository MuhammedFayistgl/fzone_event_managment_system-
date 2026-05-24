export type ScannerType = {
    token: string;
    gateName?: string;
    checkInDevice?: string;
    adminId?: string;
};

export type VerifyQrGuest = {
    name: string;
    type?: string;
    gender?: string;
    phone?: string;
};

export type VerifyQrLinkedInvestor = {
    name?: string;
    code?: string;
    phone?: string;
    no?: number | string;
};

export type VerifyQrScanData = {
    passType?: "investor" | "guest";
    holderName?: string;
    guest?: VerifyQrGuest | null;
    linkedInvestor?: VerifyQrLinkedInvestor;
    investor?: Record<string, unknown>;
    phone?: string;
    checkedInAt?: string;
    gateName?: string;
    participants?: unknown[];
};