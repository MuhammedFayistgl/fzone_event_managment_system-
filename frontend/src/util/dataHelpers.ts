import type { EventResponseType } from "../Types/event";

export const getEventStatus = (eventDays: any[]) => {
  const now = new Date();

  if (!eventDays || eventDays.length === 0) return "UPCOMING";

  const firstDay = new Date(eventDays[0].date);
  const lastDay = new Date(eventDays[eventDays.length - 1].date);

  if (now >= firstDay && now <= lastDay) return "LIVE";
  if (now < firstDay) return "UPCOMING";
  return "ENDED";
};

export const getDaysLeft = (eventDays: any[]) => {
  if (!eventDays || eventDays.length === 0) return 0;

  const firstDay = new Date(eventDays[0].date);
  const diff = firstDay.getTime() - new Date().getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const checkIsEventClosed = (
  event?: EventResponseType
): boolean => {
  if (!event) return false;

  // manual close
  if (event.isRegistrationClosed) return true;

  if (!event.eventDays || event.eventDays.length === 0) return false;

  const lastEndTime = event.eventDays
    .map((day) => {
      if (!day?.endTime) return null;

      const time = new Date(day.endTime).getTime();
      return isNaN(time) ? null : time;
    })
    .filter((time): time is number => time !== null)
    .sort((a, b) => b - a)[0];

  if (!lastEndTime) return false;

  return Date.now() > lastEndTime;
};