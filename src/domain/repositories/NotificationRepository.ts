import type { Notification, NotificationPayload } from '../entities/Notification.js';
import { BroadcastNotification } from '../entities/BroadcastNotification.js';

export interface NotificationRepository {
    send(notification: Notification): Promise<string>;
    sendToTopic(notification: BroadcastNotification): Promise<string>;
    sendToUser(token: string, payload: NotificationPayload): Promise<string>;
}
