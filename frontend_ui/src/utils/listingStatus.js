// listingStatus.js
// Helpers for showing a listing's status consistently across the app.
// The DB enum values are OPEN / IN_PROGRESS / COMPLETED; we display them as
// "OPEN" / "IN PROGRESS" / "COMPLETED".

export const LISTING_STATUS_LABELS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN PROGRESS",
  COMPLETED: "COMPLETED",
};

export function listingStatusLabel(status) {
  return LISTING_STATUS_LABELS[status] || "OPEN";
}

// Should this listing appear grayed out?
//  - Public view (someone else's profile): gray when IN_PROGRESS or COMPLETED
//    (no longer taking applicants).
//  - Private view (your own profile): gray ONLY when COMPLETED.
export function isListingGrayed(status, { isOwnerView }) {
  if (isOwnerView) return status === "COMPLETED";
  return status === "IN_PROGRESS" || status === "COMPLETED";
}
