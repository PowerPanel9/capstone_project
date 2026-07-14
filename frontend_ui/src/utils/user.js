// user.js
// Small helpers for showing a user in the UI. The backend stores firstName and
// lastName separately, so we build the full name and initials from those.

// "Marcus" + "Chen" -> "Marcus Chen"
export function fullName(user) {
  if (!user) return "Unknown";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
}

// "Marcus" + "Chen" -> "MC" (used for the avatar circle)
export function initials(user) {
  if (!user) return "?";
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}
