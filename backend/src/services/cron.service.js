import { Attendance, LocationLog } from '../models/index.js';
import { todayStr } from '../utils/dates.js';

/**
 * BACKGROUND TASKS
 * - Auto checkout users who haven't sent a location ping in 45 minutes.
 */
export function startCronJobs() {
  console.log('⏲️ Starting Background Cron Jobs...');

  // Run every 5 minutes
  setInterval(async () => {
    try {
      await autoCheckoutInactiveUsers();
    } catch (err) {
      console.error('Auto-checkout cron error:', err);
    }
  }, 5 * 60 * 1000);
}

async function autoCheckoutInactiveUsers() {
  const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);
  const today = todayStr();

  // 1. Find all active attendance records for today
  const activeSessions = await Attendance.find({
    date: today,
    'checkIn.time': { $exists: true },
    'checkOut.time': { $exists: false }
  }).select('staff checkIn.time');

  if (!activeSessions.length) return;

  const staffIds = activeSessions.map(s => s.staff);

  // 2. Fetch last known pings for all active staff in one query (Avoid N+1)
  const lastPings = await LocationLog.aggregate([
    { $match: { staff: { $in: staffIds }, recordedAt: { $gte: sixtyMinsAgo } } },
    { $group: { _id: '$staff', lastPing: { $max: '$recordedAt' } } }
  ]);

  const activeStaffMap = new Map(lastPings.map(p => [p._id.toString(), p.lastPing]));
  const now = new Date();

  for (const session of activeSessions) {
    const lastActivity = activeStaffMap.get(session.staff.toString()) || session.checkIn.time;

    if (lastActivity < sixtyMinsAgo) {
      console.log(`👤 Auto-checking out staff ${session.staff} due to inactivity.`);

      await Attendance.updateOne(
        { _id: session._id },
        {
          $set: {
            checkOut: {
              time: now,
              address: 'System Auto Checkout (Inactivity)',
              deviceInfo: { platform: 'system', model: 'automated' }
            },
            workedMinutes: Math.floor((now - session.checkIn.time) / 60000)
          }
        }
      );
    }
  }
}

