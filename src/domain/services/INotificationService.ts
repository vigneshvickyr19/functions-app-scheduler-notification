export interface INotificationService {
  /**
   * Sends a push notification to a specific token.
   */
  sendNotification(token: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
}
