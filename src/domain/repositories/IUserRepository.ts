import { User } from '../entities/User.js';

export interface IUserRepository {
  /**
   * Fetches the user profile by ID.
   */
  getUser(userId: string): Promise<User | null>;
}
