// reuse existing

import type { EventResponseType } from "./event";


// ================= INVESTOR =================
export type InvestorType = {
  name: string;
  phone: string;
  code: string;
};

// ================= PARTICIPANT =================
export type ParticipantType = {
  name: string;
  phone?: string;
  type: string;
};

// ================= REGISTRATION =================
export type RegistrationType = {
  _id: string;
  phone: string;
  participants: ParticipantType[];
  createdAt: string;
  investor: InvestorType | null;
};

// ================= FINAL EVENT =================
export type RunningEventType = EventResponseType & {
  registrations: RegistrationType[];
  totalRegistrations: number;
};