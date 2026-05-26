import { NearbyStatus } from '../entities/NearbyStatus.js';

export interface INearbyStatusRepository {
  /**
   * Fetches the nearby status for a specific user.
   */
  getNearbyStatus(userId: string): Promise<NearbyStatus | null>;

  /**
   * Updates the tracked last count and notification time for a user.
   */
  updateLastNotification(userId: string, count: number, timestamp: Date): Promise<void>;
}
