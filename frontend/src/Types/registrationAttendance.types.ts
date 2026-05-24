import type { EventPricingFields } from "../utils/pricing";

export type RegistrationParticipant = {
  _id?: string;
  name: string;
  phone?: string;
  type?: string;
  gender?: string;
  qrToken?: string;
  qrCodeImage?: string;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
  isBlocked?: boolean;
  blockedAt?: string | null;
  blockedReason?: string;
};

export type RegistrationAttendanceRow = {
  _id: string;
  registrationId?: string;
  phone: string;
  investor?: {
    Name?: string;
    Phone_No?: string | number;
    Gender?: string;
    No?: number;
    Code_No?: string;
  } | null;
  participants?: RegistrationParticipant[];
  participantsCount?: number;
  qrToken?: string | null;
  qrCodeImage?: string | null;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
  isBlocked?: boolean;
  blockedAt?: string | null;
  blockedReason?: string;
  payment?: {
    paidTotal?: number;
    status?: string;
    amount?: number;
  } | null;
  createdAt?: string;
};

export type BlockFilter = "all" | "active" | "blocked";

export type RegistrationWorkspaceProps = {
  rows: RegistrationAttendanceRow[];
  event: EventPricingFields & { _id?: string; title?: string; ticketDesign?: unknown };
  eventId: string;
  loading?: boolean;
};
