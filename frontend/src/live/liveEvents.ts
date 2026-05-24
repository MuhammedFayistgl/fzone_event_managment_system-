export type LivePassType = "investor" | "guest";

export type CheckInUpdatedPayload = {
  eventId: string;
  registrationId: string;
  phone: string;
  passType: LivePassType;
  participantId?: string | null;
  participantIndex?: number | null;
  isCheckedIn: boolean;
  checkedInAt: string;
  holderName?: string;
  gateName?: string;
};

export type RegistrationCreatedPayload = {
  eventId: string;
  registrationId: string;
  phone: string;
};

export type RegistrationBlockedPayload = {
  eventId: string;
  registrationId: string;
  phone: string;
  target: LivePassType;
  guestIndex?: number | null;
  participantId?: string | null;
  isBlocked: boolean;
  blockedReason?: string;
};

export const LIVE_EVENTS = {
  CHECKIN_UPDATED: "checkin:updated",
  REGISTRATION_CREATED: "registration:created",
  REGISTRATION_BLOCKED: "registration:blocked",
  DASHBOARD_UPDATED: "dashboard:updated",
} as const;

export type LiveServerEvent =
  | typeof LIVE_EVENTS.CHECKIN_UPDATED
  | typeof LIVE_EVENTS.REGISTRATION_CREATED
  | typeof LIVE_EVENTS.REGISTRATION_BLOCKED
  | typeof LIVE_EVENTS.DASHBOARD_UPDATED;

export type DashboardUpdatedPayload = {
  at: string;
};
