import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for upcoming appointments every 15 minutes
crons.interval(
  "send-appointment-reminders",
  { minutes: 15 },
  internal.reminders.checkAndSendReminders,
);

export default crons;
