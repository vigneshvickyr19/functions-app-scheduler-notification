import type { NotificationPayload } from './Notification.js';

export class BroadcastNotification {
    constructor(
        public readonly topic: string,
        public readonly payload: NotificationPayload
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.topic) {
            throw new Error('Topic is required');
        }
        if (!this.payload.title) {
            throw new Error('Notification title is required');
        }
        if (!this.payload.body) {
            throw new Error('Notification body is required');
        }
    }
}
