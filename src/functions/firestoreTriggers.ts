import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { handleNearbyStatusUpdateEvent } from '../controllers/events/nearbyStatusController.js';

export const onNearbyStatusUpdate = onDocumentWritten(
  {
    document: 'nearby_status/{userId}',
    region: 'asia-south1', // Using the region from the existing app
  },
  async (event) => {
    const userId = event.params.userId;

    // Do nothing if document was deleted
    if (!event.data || !event.data.after.exists) {
      return;
    }

    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Delegate entirely to the controller
    await handleNearbyStatusUpdateEvent(userId, beforeData, afterData);
  }
);
