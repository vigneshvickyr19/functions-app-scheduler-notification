export class User {
  constructor(
    public readonly id: string,
    public readonly fcmToken?: string,
    public readonly lastActiveAt?: Date
  ) {}

  /**
   * Checks if the user is eligible to receive a push notification.
   */
  public canReceiveNotifications(): boolean {
    return !!this.fcmToken;
  }
}
