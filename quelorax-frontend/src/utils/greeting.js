// Time-of-day greeting shared across dashboards (post-login header, visitor
// dashboard hero, etc). Pass the current Date in so callers can drive it from
// a ticking clock and get a real-time update as the hour rolls over.
export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
