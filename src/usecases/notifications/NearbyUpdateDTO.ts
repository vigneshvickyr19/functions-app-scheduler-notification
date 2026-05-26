export interface NearbyUpdateDTO {
  userId: string;
  beforeCount: number;
  afterCount: number;
  afterUsernames: string[];
  lastNearbyCount?: number;
  lastNearbyNotificationAt?: Date;
  updatedAt: Date;
}
