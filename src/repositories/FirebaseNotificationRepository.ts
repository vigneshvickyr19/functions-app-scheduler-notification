import * as logger from 'firebase-functions/logger';
import { messaging } from '../firebase/firebase.config.js';
import { Notification } from '../domain/entities/Notification.js';
import { BroadcastNotification } from '../domain/entities/BroadcastNotification.js';
import type { NotificationRepository } from '../domain/repositories/NotificationRepository.js';
import { AppError } from '../shared/errors/AppError.js';



export class FirebaseNotificationRepository implements NotificationRepository {
    private stringifyData(data?: Record<string, any>): Record<string, string> {
        if (!data) return {};
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = typeof value === 'string' ? value : String(value);
        }
        return result;
    }

    async send(notification: Notification): Promise<string> {
        const { deviceToken, payload } = notification;

        const message: any = {
            token: deviceToken,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: this.stringifyData(payload.data),
            // Android Specific Config
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                },
            },
            // iOS (APNS) Specific Config
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        contentAvailable: true,
                        mutableContent: true,
                    },
                },
                headers: {
                    'apns-priority': '10', // High priority
                },
            },
        };

        try {
            logger.info('Sending FCM message to token:', { deviceToken });
            const response = await messaging.send(message);
            logger.info('Successfully sent message:', { response });
            return response;
        } catch (error: any) {
            logger.error('Error sending push notification:', { error });
            throw new AppError(`Firebase notification failed: ${error.message}`, 500);
        }
    }

    async sendToTopic(notification: BroadcastNotification): Promise<string> {
        const { topic, payload } = notification;

        // Ensure topic is clean
        const cleanTopic = topic.startsWith('/topics/') ? topic.replace('/topics/', '') : topic;

        const message: any = {
            topic: cleanTopic,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: this.stringifyData(payload.data),
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: payload.data?.click_action || 'FLUTTER_NOTIFICATION_CLICK',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        contentAvailable: true,
                        mutableContent: true,
                    },
                },
                headers: {
                    'apns-priority': '10',
                },
            },
        };

        try {
            logger.info(`[FCM] Sending broadcast to topic: ${cleanTopic}`, { message });

            const response = await messaging.send(message);

            logger.info(`[FCM] Broadcast Success: ${response}`);
            return response;
        } catch (error: any) {
            logger.error('[FCM] Broadcast Error:', { error });
            throw new AppError(`Firebase topic notification failed: ${error.message}`, 500);
        }
    }

    async sendToUser(token: string, payload: any): Promise<string> {
        const message: any = {
            token: token,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: this.stringifyData(payload.data),
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: payload.data?.click_action || 'FLUTTER_NOTIFICATION_CLICK',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        contentAvailable: true,
                        mutableContent: true,
                    },
                },
                headers: {
                    'apns-priority': '10',
                },
            },
        };

        try {
            const response = await messaging.send(message);
            return response;
        } catch (error: any) {
            logger.error('[FCM] Send To User Error:', { error: error.message });
            const appError = new AppError(`Firebase individual notification failed: ${error.message}`, 500);
            // Attach the original error info so UseCases can handle specific codes
            (appError as any).errorInfo = error.errorInfo;
            throw appError;
        }
    }
}
