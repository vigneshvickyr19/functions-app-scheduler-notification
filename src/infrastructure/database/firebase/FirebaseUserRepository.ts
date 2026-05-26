import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';
import { db } from './firebase.config.js';

export class FirebaseUserRepository implements IUserRepository {
  private readonly collection = db.collection('users');

  async getUser(userId: string): Promise<User | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return new User(
      userId,
      data.fcmToken,
      data.lastActiveAt?.toDate()
    );
  }
}
