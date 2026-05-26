export class NearbyStatus {
  constructor(
    public readonly userId: string,
    public readonly nearbyCount: number,
    public readonly nearbyUsernames: string[],
    public readonly updatedAt: Date,
    public lastNearbyCount?: number,
    public lastNearbyNotificationAt?: Date
  ) {}

  /**
   * Checks if the nearby count has increased compared to the last tracked count.
   */
  public hasCountIncreased(): boolean {
    const previous = this.lastNearbyCount || 0;
    return this.nearbyCount > previous;
  }

  /**
   * Checks if enough time has passed since the last notification to send a new one.
   * @param cooldownMinutes Minimum time in minutes between notifications.
   * @param currentTime The current time to compare against.
   */
  public isCooldownPassed(cooldownMinutes: number, currentTime: Date): boolean {
    if (!this.lastNearbyNotificationAt) {
      return true;
    }
    
    const diffMs = currentTime.getTime() - this.lastNearbyNotificationAt.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes >= cooldownMinutes;
  }
}
