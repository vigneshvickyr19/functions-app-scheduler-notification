import type { NearbyUpdateDTO } from './NearbyUpdateDTO.js';
import type { INearbyStatusRepository } from '../../domain/repositories/INearbyStatusRepository.js';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import type { INotificationService } from '../../domain/services/INotificationService.js';
import { NearbyStatus } from '../../domain/entities/NearbyStatus.js';

export class SendNearbyNotificationUseCase {
  private readonly COOLDOWN_MINUTES = 5;

  constructor(
    private nearbyStatusRepo: INearbyStatusRepository,
    private userRepo: IUserRepository,
    private notificationService: INotificationService
  ) {}

  public async execute(dto: NearbyUpdateDTO): Promise<void> {
    const { userId, afterCount, afterUsernames, lastNearbyCount, lastNearbyNotificationAt, updatedAt } = dto;

    // 1. Reconstruct Entity to leverage business rules
    const status = new NearbyStatus(
      userId,
      afterCount,
      afterUsernames,
      updatedAt,
      lastNearbyCount,
      lastNearbyNotificationAt
    );

    // 2. Business Rule: Did count increase?
    if (!status.hasCountIncreased()) {
      console.log(`[${userId}] Notification skipped: Count did not increase.`);
      return;
    }

    // 3. Business Rule: Is cooldown active?
    const now = new Date();
    if (!status.isCooldownPassed(this.COOLDOWN_MINUTES, now)) {
      console.log(`[${userId}] Notification skipped: Cooldown active.`);
      return;
    }

    // 4. Fetch User to verify notification eligibility
    const user = await this.userRepo.getUser(userId);
    if (!user) {
      console.log(`[${userId}] Notification skipped: User not found.`);
      return;
    }

    if (!user.canReceiveNotifications()) {
      console.log(`[${userId}] Notification skipped: No FCM token available.`);
      return;
    }

    // 5. Build user-friendly notification with emojis
    const title = '✨ New people nearby!';
    let body = `There are ${afterCount} people near you. See if you like each other 💫`;
    
    if (afterUsernames && afterUsernames.length > 0) {
      if (afterCount === 1) {
        body = `${afterUsernames[0]} is near you! See if you like each other 💖`;
      } else {
        body = `${afterUsernames[0]} and ${afterCount - 1} others are near you. Check them out! ✨`;
      }
    }
    await this.notificationService.sendNotification(user.fcmToken!, title, body, {
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      type: 'NEARBY_UPDATE',
      userId: userId,
    });

    // 6. Update the tracked state in the repository
    await this.nearbyStatusRepo.updateLastNotification(userId, afterCount, now);
    console.log(`[${userId}] Notification sent successfully and state updated.`);
  }
}
