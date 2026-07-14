const NodeGeocoder = require("node-geocoder");

const geocoder = NodeGeocoder({
  provider: "locationiq",
  apiKey: process.env.LOCATIONIQ_API_KEY,
  formatter: null,
});

async function forwardGeocode(addressText) {
  if (!process.env.LOCATIONIQ_API_KEY) {
    throw new Error("LOCATIONIQ_API_KEY is not configured");
  }

  const results = await geocoder.geocode(addressText);
  if (!results || results.length === 0) {
    throw new Error("Address not found");
  }

  const first = results[0];
  return {
    latitude: first.latitude,
    longitude: first.longitude,
    locationText: first.formattedAddress || first.formatted || addressText,
  };
}

async function reverseGeocode(latitude, longitude) {
  if (!process.env.LOCATIONIQ_API_KEY) {
    throw new Error("LOCATIONIQ_API_KEY is not configured");
  }

  const results = await geocoder.reverse({ lat: latitude, lon: longitude });
  if (!results || results.length === 0) return null;
  return results[0].formattedAddress || results[0].formatted || null;
}

module.exports = { forwardGeocode, reverseGeocode };