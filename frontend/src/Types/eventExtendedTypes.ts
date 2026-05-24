// reuse existing

import type { EventResponseType } from "./event";

export type DashboardEventStatus = "upcoming" | "running" | "ended";

// ================= INVESTOR =================
export type InvestorType = {
  name: string;
  phone: string;
  code: string;
};

// ================= PARTICIPANT =================
export type PassType = "investor" | "guest";

export type ParticipantType = {
  _id?: string;
  name: string;
  phone?: string;
  type: string;
  gender?: string;
  qrToken?: string;
  qrCodeImage?: string;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
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
  startTime: number;
  endTime: number;
  daysLeft: number;
  status: DashboardEventStatus;
};

export type DashboardEventsCounts = {
  upcoming: number;
  running: number;
  past: number;
};

export type DashboardEventsGrouped = {
  upcoming: RunningEventType[];
  running: RunningEventType[];
  past: RunningEventType[];
};

export type DashboardEventsPayload = {
  counts: DashboardEventsCounts;
  data: DashboardEventsGrouped;
};
