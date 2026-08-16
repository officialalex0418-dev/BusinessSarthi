import { env } from '../config/env.js';
import { SimpleCache } from './cache.js';

const geoCache = new SimpleCache(86400); // 1 day cache for geocoding results

/**
 * Reverse geocodes coordinates to a human-readable address.
 * Uses Google Maps if configured, otherwise falls back to Nominatim (OSM).
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  // Round to 4 decimals (~11m precision) to cache nearby lookups
  const roundedLat = Number(lat).toFixed(4);
  const roundedLng = Number(lng).toFixed(4);
  const cacheKey = `geo:${roundedLat}:${roundedLng}`;

  const cached = geoCache.get(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    let address = null;
    // 1. Try Google Maps if key is available
    if (env.googleMapsApiKey) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googleMapsApiKey}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      if (data.status === 'OK' && data.results[0]) {
        address = data.results[0].formatted_address;
      }
    }

    // 2. Fallback to Nominatim (OSM)
    if (!address) {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'BusinessSarthi/1.0' },
        signal: controller.signal
      });
      const data = await res.json();
      if (data && data.display_name) {
        address = data.display_name;
      }
    }

    if (address) {
      geoCache.set(cacheKey, address);
      return address;
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

