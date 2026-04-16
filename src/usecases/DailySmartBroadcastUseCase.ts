import * as logger from 'firebase-functions/logger';
import { firestore } from '../firebase/firebase.config.js';
import type { NotificationRepository } from '../domain/repositories/NotificationRepository.js';
import { SMART_NOTIFICATION_MESSAGES, INACTIVE_MESSAGES } from '../config/smartNotifications.config.js';
import type { TimeSlot } from '../config/smartNotifications.config.js';


export class DailySmartBroadcastUseCase {
    private readonly BATCH_SIZE = 500;
    private readonly MAX_DAILY_NOTIFICATIONS = 6;

    constructor(private notificationRepository: NotificationRepository) { }

    async execute(): Promise<{ totalProcessed: number; sent: number; skipped: number; errors: number }> {
        const stats = { totalProcessed: 0, sent: 0, skipped: 0, errors: 0 };
        
        // Use IST date for consistency with scheduled triggers
        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        const currentSlot = this.getCurrentTimeSlot();

        let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        let hasMore = true;

        logger.info(`[SmartBroadcast] Starting execution for ${today}, Slot: ${currentSlot}`);

        while (hasMore) {
            // Optimization: Only fetch users who actually have an FCM token
            let query = firestore.collection('users')
                .where('fcmToken', '>=', '') // Effectively 'not null and not empty'
                .orderBy('fcmToken')
                .limit(this.BATCH_SIZE);

            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();
            if (snapshot.empty) {
                hasMore = false;
                break;
            }

            const batchResults = await Promise.all(
                snapshot.docs.map(doc => this.processUser(doc as FirebaseFirestore.QueryDocumentSnapshot, today, currentSlot))
            );

            for (const result of batchResults) {
                stats.totalProcessed++;
                if (result === 'sent') stats.sent++;
                else if (result === 'skipped') stats.skipped++;
                else if (result === 'error') stats.errors++;
            }

            if (snapshot.docs.length > 0) {
                lastDoc = snapshot.docs[snapshot.docs.length - 1] as FirebaseFirestore.QueryDocumentSnapshot;
            } else {
                lastDoc = null;
            }

            if (snapshot.size < this.BATCH_SIZE) {
                hasMore = false;
            }
        }

        logger.info(`[SmartBroadcast] Completed: Sent=${stats.sent}, Skipped=${stats.skipped}, Errors=${stats.errors}`);
        return stats;
    }

    private async processUser(
        doc: FirebaseFirestore.QueryDocumentSnapshot,
        today: string,
        currentSlot: TimeSlot
    ): Promise<'sent' | 'skipped' | 'error'> {
        const data = doc.data();
        const fcmToken = data.fcmToken;
        if (!fcmToken) {
            logger.info(`[SmartBroadcast] Skipping user ${doc.id}: No FCM token found`);
            return 'skipped';
        }

        const sentToday = data.lastNotificationDate === today ? (data.notificationsSentToday || 0) : 0;
        const lastActiveAt = data.lastActiveAt?.toDate() || new Date(0);
        
        // Convert lastActiveAt to IST date string for comparison
        const lastActiveDateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(lastActiveAt);

        // Logical Skip Conditions
        if (sentToday >= this.MAX_DAILY_NOTIFICATIONS) {
            logger.info(`[SmartBroadcast] Skipping user ${doc.id}: Daily limit reached`);
            return 'skipped';
        }

        if (lastActiveDateStr === today) {
            logger.info(`[SmartBroadcast] Skipping user ${doc.id}: Already active today`);
            return 'skipped';
        }

        const diffTime = Math.abs(new Date().getTime() - lastActiveAt.getTime());
        const inactiveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let message: { title: string; text: string; screen: string; id: string };
        let nextMessageIndexUpdate: number | undefined;

        // 1. Inactivity Logic
        if (inactiveDays >= 3) {
            if (data.lastNotificationDate === today) {
                logger.info(`[SmartBroadcast] Skipping inactive user ${doc.id}: Already notified today`);
                return 'skipped';
            }

            if (inactiveDays >= 3 && inactiveDays < 5) {
                message = { ...INACTIVE_MESSAGES.short, id: 'inactive_short' };
            } else if (inactiveDays >= 5 && inactiveDays < 7) {
                message = { ...INACTIVE_MESSAGES.medium, id: 'inactive_medium' };
            } else {
                message = { ...INACTIVE_MESSAGES.long, id: 'inactive_long' };
            }
        } 
        // 2. Normal Time-Based Flow
        else {
            const slotData = SMART_NOTIFICATION_MESSAGES[currentSlot];
            if (!slotData) return 'skipped';

            const gender = (data.gender === 'female' ? 'female' : 'male') as 'male' | 'female';
            const messages = slotData[gender];
            
            if (!messages?.length) return 'skipped';

            let index = data.lastMessageIndex || 0;
            if (index >= messages.length) index = 0;

            const selected = messages[index];
            if (!selected) return 'skipped';

            message = { 
                title: selected.title, 
                text: selected.text, 
                screen: selected.screen, 
                id: selected.id 
            };
            nextMessageIndexUpdate = (index + 1) % messages.length;
        }

        try {
            await this.notificationRepository.sendToUser(fcmToken, {
                title: message.title,
                body: message.text,
                data: {
                    screen: message.screen,
                    messageId: message.id,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK'
                }
            });

            const updatePayload: any = {
                notificationsSentToday: sentToday + 1,
                lastNotificationDate: today
            };
            
            if (nextMessageIndexUpdate !== undefined) {
                updatePayload.lastMessageIndex = nextMessageIndexUpdate;
            }

            await doc.ref.update(updatePayload);
            return 'sent';
        } catch (error: any) {
            const isUnregistered = error.message?.includes('registration-token-not-registered') || 
                                  error.errorInfo?.code === 'messaging/registration-token-not-registered';

            if (isUnregistered) {
                logger.warn(`[SmartBroadcast] Token unregistered for user ${doc.id}. Clearing token...`);
                try {
                    await doc.ref.update({ fcmToken: null });
                } catch (updateError) {
                    logger.error(`[SmartBroadcast] Failed to clear stale token for ${doc.id}:`, updateError);
                }
                return 'skipped';
            }

            logger.error(`[SmartBroadcast] Error processing user ${doc.id}`, { error: error.message });
            return 'error';
        }
    }


    private getCurrentTimeSlot(): TimeSlot {
        const istHour = parseInt(new Intl.DateTimeFormat('en-IN', {
            hour: 'numeric',
            hour12: false,
            timeZone: 'Asia/Kolkata'
        }).format(new Date()));

        // 00:00 to 06:00 -> night
        // 06:00 to 12:00 -> morning
        // 12:00 to 16:00 -> afternoon
        // 16:00 to 20:00 -> evening
        // 20:00 to 23:59 -> night
        
        if (istHour >= 6 && istHour < 12) return 'morning';
        if (istHour >= 12 && istHour < 16) return 'afternoon';
        if (istHour >= 16 && istHour < 20) return 'evening';
        return 'night';
    }
}
