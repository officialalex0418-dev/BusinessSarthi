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
  // Nepal is +5:45 (345 minutes) from UTC
  const utcMins = d.getUTCHours() * 60 + d.getUTCMinutes();
  let nepalMins = utcMins + 345;

  // Handle wrap-around (midnight)
  if (nepalMins >= 1440) nepalMins -= 1440;
  if (nepalMins < 0) nepalMins += 1440;

  return nepalMins;
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
