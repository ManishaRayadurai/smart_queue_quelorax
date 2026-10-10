// Shared helpers for picking a preferred visiting DATE and TIME when booking
// a token. Used by both the visitor's "Book a token" page and the
// receptionist's "Book walk-in" page so the two flows stay consistent.
//
// Booking is time-based: once a slot's date/time has passed, it can no
// longer be selected or booked (the backend also enforces this — see
// QueueTokenService#createToken).

// Business hours the slot picker covers. Change these in one place and both
// forms pick it up.
export const SLOT_START_HOUR = 9; // 9:00 AM
export const SLOT_END_HOUR = 18; // 6:00 PM

// How many days ahead (including today) a visitor can pick a date for.
export const BOOKING_WINDOW_DAYS = 7;

const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isSameDateKey = (a, b) => toDateKey(a) === toDateKey(b);

// Builds the list of pickable dates starting today, `windowDays` long.
// Each entry carries a `dateKey` (yyyy-mm-dd, used to drive buildSlots) and
// a short display label ("Today", "Tomorrow", or e.g. "Fri, 12 Jun").
export function buildDateOptions(windowDays = BOOKING_WINDOW_DAYS) {
  const today = new Date();
  const options = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    let label;
    if (i === 0) label = "Today";
    else if (i === 1) label = "Tomorrow";
    else label = d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
    options.push({ dateKey: toDateKey(d), label, date: d });
  }
  return options;
}

// Builds a single day's list of pickable arrival slots — every half hour
// from SLOT_START_HOUR to SLOT_END_HOUR. When `dateKey` refers to today,
// slots earlier than "now" (plus a small buffer) are marked `disabled` so
// the UI can grey them out instead of hiding them — once the time has
// passed, it can't be booked. Slots on any future date are never disabled
// on the time axis (the whole date is already in the future).
export function buildSlots(stepMinutes = 30, { bufferMinutes = 15, dateKey } = {}) {
  const now = new Date();
  const cutoff = now.getTime() + bufferMinutes * 60 * 1000;

  const base = dateKey ? new Date(`${dateKey}T00:00:00`) : now;
  const today = isSameDateKey(base, now);

  const start = new Date(base);
  start.setHours(SLOT_START_HOUR, 0, 0, 0);
  const end = new Date(base);
  end.setHours(SLOT_END_HOUR, 0, 0, 0);

  const slots = [];
  for (let t = start.getTime(); t <= end.getTime(); t += stepMinutes * 60 * 1000) {
    slots.push({ time: t, disabled: today && t < cutoff });
  }
  return slots;
}

export const formatSlot = (ms) =>
  new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// Full date + time, e.g. "Fri, 12 Jun · 2:30 PM" — used wherever a scheduled
// slot needs to be unambiguous about which day it falls on.
export const formatSlotDateTime = (ms) =>
  new Date(ms).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

// True once a chosen slot's date/time is in the past — used for a final
// client-side guard right before submit, mirroring the backend check.
export const isSlotInPast = (ms, bufferMinutes = 0) =>
  ms != null && ms < Date.now() - bufferMinutes * 60 * 1000;
