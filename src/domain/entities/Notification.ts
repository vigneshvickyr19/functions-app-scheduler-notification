export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class Notification {
  constructor(
    public readonly deviceToken: string,
    public readonly payload: NotificationPayload
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.deviceToken) {
      throw new Error('Device token is required');
    }
    if (!this.payload.title) {
      throw new Error('Notification title is required');
    }
    if (!this.payload.body) {
      throw new Error('Notification body is required');
    }
  }
}
