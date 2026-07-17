const NodeGeocoder = require('node-geocoder');

const geocoder = NodeGeocoder({
    provider: 'locationiq',
    apiKey: process.env.LOCATIONIQ_API_KEY,
});

const results = await geocoder.geocode('123 Main St, Fort Worth, TX');
// results[0] => { latitude, longitude, formattedAddress, city, state, zipcode, ... }





const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

// Convert user input (local time) to UTC before storing
const scheduledAt = dayjs.tz('2026-07-15 10:00', 'America/Chicago').utc().toISOString();

// Insert into Postgres
await pool.query(
  `INSERT INTO bookings (provider_id, scheduled_at) VALUES ($1, $2)`,
  [providerId, scheduledAt]
);

// Display back to a user in their timezone
const local = dayjs.utc(row.scheduled_at).tz('America/Chicago').format('MMM D, YYYY h:mm A'); 