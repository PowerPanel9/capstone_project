// categories.js
// Shared list of service categories (matches the backend ListingCategory enum).
// `value` is what's stored in the database; `label` is the friendlier text
// shown to users. Used by onboarding, the profile edit form, and anywhere we
// display a provider's chosen categories.

export const CATEGORY_OPTIONS = [
  { value: "CLEANING", label: "Cleaning" },
  { value: "TUTORING", label: "Tutoring" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "GARDENING", label: "Gardening" },
  { value: "BEAUTY", label: "Beauty" },
  { value: "BABYSITTING", label: "Babysitting" },
  { value: "MOVING", label: "Moving" },
  { value: "HANDYMAN", label: "Handyman" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "OTHER", label: "Other" },
];

// Look up the friendly label for a stored category value (e.g. "GARDENING" -> "Gardening").
// Falls back to the raw value so an unexpected value still shows something.
export function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value;
}
