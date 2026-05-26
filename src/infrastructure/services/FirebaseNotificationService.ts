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
    };
    if (data) {
        payload.data = data;
    }

    await messaging.send(payload);
  }
}
