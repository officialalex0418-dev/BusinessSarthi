/**
 * Corrected date string utilities for Nepal (+5:45)
 */
export const todayStr = (d = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d); // Returns YYYY-MM-DD reliably
};

export const monthStr = (d = new Date()) => {
  return todayStr(d).slice(0, 7); // Returns YYYY-MM
};

/** Returns total minutes from midnight in Nepal Time (Asia/Kathmandu) */
export function getNepalMinutes(d = new Date()) {
  try {
    const options = {
      timeZone: 'Asia/Kathmandu',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(d);

    const getPart = (type) => parts.find(p => p.type === type)?.value;
    const hour = getPart('hour') || '0';
    const minute = getPart('minute') || '0';

    return parseInt(hour, 10) * 60 + parseInt(minute, 10);
  } catch (err) {
    // Fallback if Intl fails
    const nepalOffset = 5.75 * 60 * 60 * 1000; // +5:45
    const nepalTime = new Date(d.getTime() + nepalOffset);
    return nepalTime.getUTCHours() * 60 + nepalTime.getUTCMinutes();
  }
}

/** Pure function to check if a check-in is late */
export function isLateArrival(checkInTime, shiftStartTime, bufferMinutes = 0) {
  if (!checkInTime || !shiftStartTime) return false;

  const [sh, sm] = shiftStartTime.split(':').map(Number);
  const checkInMins = getNepalMinutes(new Date(checkInTime));
  const thresholdMins = sh * 60 + sm + bufferMinutes;

  return checkInMins > thresholdMins;
}

export function rangeFromPeriod(period) {
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const endY = new Date(start);
      endY.setHours(23, 59, 59, 999);
      return { start, end: endY };
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case '30days':
      start.setDate(now.getDate() - 30);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case '3months':
      start.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      start.setMonth(now.getMonth() - 6);
      break;
    case '1year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}
