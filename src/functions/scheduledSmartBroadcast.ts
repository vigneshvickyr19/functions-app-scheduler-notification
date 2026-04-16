import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { DailySmartBroadcastUseCase } from '../usecases/DailySmartBroadcastUseCase.js';
import { FirebaseNotificationRepository } from '../repositories/FirebaseNotificationRepository.js';


/**
 * Scheduled function to run at specific engagement peaks:
 * 9:00 AM, 1:00 PM, 7:00 PM IST
 */
export const scheduledSmartBroadcast = onSchedule({
    schedule: "0 9,13,19 * * *",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "512MiB",
    timeoutSeconds: 300
}, async (event) => {
    logger.info('[ScheduledSmartBroadcast] Triggered for IST peak engagement hour');

    const repository = new FirebaseNotificationRepository();
    const useCase = new DailySmartBroadcastUseCase(repository);

    try {
        const result = await useCase.execute();
        logger.info('[ScheduledSmartBroadcast] Execution Summary', { result });
    } catch (error) {
        logger.error('[ScheduledSmartBroadcast] Execution Failed', { error });
    }
});

