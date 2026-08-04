import { env } from '../config/env.js';

/**
 * Reverse geocodes coordinates to a human-readable address.
 * Uses Google Maps if configured, otherwise falls back to Nominatim (OSM).
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    // 1. Try Google Maps if key is available
    if (env.googleMapsApiKey) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googleMapsApiKey}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      if (data.status === 'OK' && data.results[0]) {
        clearTimeout(timeoutId);
        return data.results[0].formatted_address;
      }
    }

    // 2. Fallback to Nominatim (OSM)
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BusinessSarthi/1.0' },
      signal: controller.signal
    });
    const data = await res.json();
    clearTimeout(timeoutId);
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Geocoding timeout after 5s');
    } else {
      console.error('Reverse Geocoding Error:', error.message);
    }
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}
