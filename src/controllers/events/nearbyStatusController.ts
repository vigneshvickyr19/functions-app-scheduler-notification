import type { NearbyUpdateDTO } from '../../usecases/notifications/NearbyUpdateDTO.js';
import { SendNearbyNotificationUseCase } from '../../usecases/notifications/SendNearbyNotificationUseCase.js';
import { FirebaseNearbyStatusRepository } from '../../infrastructure/database/firebase/FirebaseNearbyStatusRepository.js';
import { FirebaseUserRepository } from '../../infrastructure/database/firebase/FirebaseUserRepository.js';
import { FirebaseNotificationService } from '../../infrastructure/services/FirebaseNotificationService.js';

export const handleNearbyStatusUpdateEvent = async (
  userId: string,
  beforeData: any,
  afterData: any
): Promise<void> => {
  try {
    // 1. Prepare DTO from raw event payload
    const dto: NearbyUpdateDTO = {
      userId,
      beforeCount: beforeData?.nearbyCount || 0,
      afterCount: afterData.nearbyCount || 0,
      afterUsernames: afterData.nearbyUsernames || [],
      lastNearbyCount: afterData.lastNearbyCount,
      lastNearbyNotificationAt: afterData.lastNearbyNotificationAt?.toDate(),
      updatedAt: afterData.updatedAt?.toDate() || new Date(),
    };

    // 2. Instantiate UseCase and inject infrastructure (Dependency Injection)
    const useCase = new SendNearbyNotificationUseCase(
      new FirebaseNearbyStatusRepository(),
      new FirebaseUserRepository(),
      new FirebaseNotificationService()
    );

    // 3. Execute Application Logic
    await useCase.execute(dto);

  } catch (error) {
    console.error(`[${userId}] Error handling nearby status update event:`, error);
  }
};
