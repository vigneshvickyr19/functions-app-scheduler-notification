import * as dotenv from 'dotenv';
import { scheduledSmartBroadcast } from './functions/scheduledSmartBroadcast.js';
import { resetDailyNotificationCounter } from './functions/resetDailyNotificationCounter.js';

dotenv.config();

/**
 * Scheduled Jobs for Smart Notification System
 * Timezone: Asia/Kolkata (IST)
 */

// 1. Broadcast job: Runs at 9 AM, 1 PM, 7 PM IST
export const broadcastJob = scheduledSmartBroadcast;

// 2. Midnight reset job: Runs at 00:00 IST
export const midnightResetJob = resetDailyNotificationCounter;
