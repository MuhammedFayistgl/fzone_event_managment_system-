export type LocationType = "online" | "offline";

export type Guest = {
  id: string;
  name: string;
  relation: string;
  gender: "" | "Male" | "Female" | "Other";
  phone?: string;
};

export type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

export type Category = {
  id: string;
  name: string;
  fields: Field[];
};

export type EventFormState = {
  _id: string;
  title: string;
  description: string;

  maxParticipants: number;
  maxPerUser: number;

  startDate: Date | null;
  endDate: Date | null;
  registrationStart: Date | null;
  registrationDeadline: Date | null;
  expiryDate: Date | null;

  isPaid: boolean;
  price: number;
  investorIsFree?: boolean;
  investorPrice?: number;
  guestPaymentEnabled?: boolean;
  guestPrice?: number;
  freeGuestCount?: number;
  currency: string;

  isRefundable: boolean;

  locationType: LocationType;
  location: string;
  startTime: number;
  banner: string;

  isPrivate: boolean;
  status: string;

  allowGuests: boolean;
  guests: Guest[]; // ✅ IMPORTANT

  categories: Category[];
};

export type EventDay = {
  id: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
};

export type TicketDesignMode = "default" | "custom";
export type TicketTextTheme = "dark" | "light";

export type TicketDesign = {
  mode: TicketDesignMode;
  backgroundUrl?: string | null;
  textTheme?: TicketTextTheme;
  uploadedAt?: string | null;
  originalFileName?: string | null;
};

export type EventResponseType = {
  _id: string;
  title: string;
  description: string;

  maxParticipants: number;
  maxPerUser: number;

  registrationStart: string;
  registrationDeadline: string;

  isPaid: boolean;
  price: number;
  investorIsFree?: boolean;
  investorPrice?: number;
  guestPaymentEnabled?: boolean;
  guestPrice?: number;
  freeGuestCount?: number;

  isRefundable: boolean;

  locationType: LocationType;
  location: string;
  isRegistrationClosed: boolean
  allowGuests: boolean;
  createdAt: string;
  updatedAt: string;
  eventDays: EventDay[];
  ticketDesign?: TicketDesign;

};