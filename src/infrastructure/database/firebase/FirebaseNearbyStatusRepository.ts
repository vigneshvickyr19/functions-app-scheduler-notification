import type { INearbyStatusRepository } from '../../../domain/repositories/INearbyStatusRepository.js';
import { NearbyStatus } from '../../../domain/entities/NearbyStatus.js';
import { db } from './firebase.config.js';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export class FirebaseNearbyStatusRepository implements INearbyStatusRepository {
  private readonly collection = db.collection('nearby_status');

  async getNearbyStatus(userId: string): Promise<NearbyStatus | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return new NearbyStatus(
      userId,
      data.nearbyCount || 0,
      data.nearbyUsernames || [],
      data.updatedAt?.toDate() || new Date(),
      data.lastNearbyCount,
      data.lastNearbyNotificationAt?.toDate()
    );
  }

  async updateLastNotification(userId: string, count: number, timestamp: Date): Promise<void> {
    await this.collection.doc(userId).update({
      lastNearbyCount: count,
      lastNearbyNotificationAt: Timestamp.fromDate(timestamp),
    });
  }
}
