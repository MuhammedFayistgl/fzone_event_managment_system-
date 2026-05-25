export type NotificationPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "critical";

export type NotificationCategory =
  | "registration"
  | "payment"
  | "checkin"
  | "security"
  | "finance"
  | "system"
  | "event"
  | "webhook";

export type NotificationAction = {
  id: string;
  label: string;
  kind: "link" | "api";
  method?: string;
  url?: string;
  variant?: "primary" | "secondary" | "danger";
};

export type AppNotification = {
  _id: string;
  notificationId: string;
  eventKey: string;
  type: string;
  category: NotificationCategory | string;
  priority: NotificationPriority;
  title: string;
  message: string;
  description?: string;
  entity: {
    type?: string;
    id?: string;
    eventId?: string;
    phone?: string;
  };
  route: {
    path?: string;
    query?: Record<string, string>;
    href?: string;
    highlightId?: string;
  };
  actions: NotificationAction[];
  metadata: Record<string, unknown>;
  read: boolean;
  archived: boolean;
  pinned: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationFilters = {
  category: string;
  priority: string;
  read: "all" | "true" | "false";
  search: string;
};

export const DEFAULT_NOTIFICATION_FILTERS: NotificationFilters = {
  category: "all",
  priority: "all",
  read: "all",
  search: "",
};
