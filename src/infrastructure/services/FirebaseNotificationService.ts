import type { INotificationService } from '../../domain/services/INotificationService.js';
import { messaging } from '../database/firebase/firebase.config.js';

export class FirebaseNotificationService implements INotificationService {
  async sendNotification(token: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    const payload: any = {
      token,
      notification: {
        title,
        body,
      },
      // Force immediate delivery on Android (bypasses Doze mode)
      android: {
        priority: 'high',
        notification: {
          channelId: 'high_importance_channel', // Matches the Flutter channel we set up
        }
      },
      // Force immediate delivery on iOS
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
          }
        }
      }
    };
    if (data) {
        payload.data = data;
    }

    await messaging.send(payload);
  }
}
