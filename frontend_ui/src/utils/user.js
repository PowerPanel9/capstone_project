// user.js
// Small helpers for showing a user in the UI. The backend stores firstName and
// lastName separately, so we build the full name and initials from those.

// "Marcus" + "Chen" -> "Marcus Chen"
export function fullName(user) {
  if (!user) return "Unknown";
  const formatPart = (value) =>
    String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");

  const first = formatPart(user.firstName);
  const last = formatPart(user.lastName);
  return `${first} ${last}`.trim();
}

// "Marcus" + "Chen" -> "MC" (used for the avatar circle)
export function initials(user) {
  if (!user) return "?";
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}
