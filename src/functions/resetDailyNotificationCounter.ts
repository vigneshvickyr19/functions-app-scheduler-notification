import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { firestore } from '../firebase/firebase.config.js';
import { DailySmartBroadcastUseCase } from '../usecases/DailySmartBroadcastUseCase.js';
import { FirebaseNotificationRepository } from '../repositories/FirebaseNotificationRepository.js';


/**
 * Combined Midnight Job: 
 * 1. Resets notification counters for all users to 0.
 * 2. Sends the first 'Night' notification of the new day.
 */
export const resetDailyNotificationCounter = onSchedule({
    schedule: "0 0 * * *",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "512MiB",
    timeoutSeconds: 300
}, async (event) => {
    logger.info('[MidnightJob] Starting combined Reset + Send operation (IST)...');
    
    // 1. Reset counters for users who had a count > 0 yesterday
    let totalReset = 0;
    let hasMoreReset = true;

    while (hasMoreReset) {
        try {
            const query = await firestore.collection('users').where('notificationsSentToday', '>', 0).limit(500).get();
            if (query.empty) {
                hasMoreReset = false;
                break;
            }

            const batch = firestore.batch();
            query.docs.forEach(doc => batch.update(doc.ref, { 
                notificationsSentToday: 0,
                lastNotificationDate: null // Optional: force eligibility for new day
            }));
            
            await batch.commit();
            totalReset += query.size;
            
            if (query.size < 500) hasMoreReset = false;
        } catch (error) {
            logger.error('[MidnightJob] Error in reset batch operation', { error });
            hasMoreReset = false;
        }
    }
    logger.info(`[MidnightJob] Counter reset completed for ${totalReset} users.`);

    // 2. Trigger first Smart Broadcast of the day
    const repository = new FirebaseNotificationRepository();
    const useCase = new DailySmartBroadcastUseCase(repository);

    try {
        logger.info('[MidnightJob] Triggering first Smart Broadcast of the day...');
        const result = await useCase.execute();
        logger.info('[MidnightJob] Broadcast Summary', { result });
    } catch (error) {
        logger.error('[MidnightJob] Broadcast failed', { error });
    }
});

