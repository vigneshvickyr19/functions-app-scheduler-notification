import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let app: App;

const initializeFirebase = (): App => {
    const apps = getApps();

    if (apps.length > 0) {
        return apps[0]!;
    }

    if (process.env.FB_PRIVATE_KEY && process.env.FB_CLIENT_EMAIL && process.env.FB_PROJECT_ID) {
        const privateKey = process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n');
        return initializeApp({
            credential: cert({
                projectId: process.env.FB_PROJECT_ID,
                clientEmail: process.env.FB_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }
    // Option 2: Load from File (Local Development)
    else if (process.env.FB_SERVICE_ACCOUNT_PATH) {
        const serviceAccountPath = process.env.FB_SERVICE_ACCOUNT_PATH;
        const absolutePath = path.isAbsolute(serviceAccountPath)
            ? serviceAccountPath
            : path.join(process.cwd(), serviceAccountPath);

        return initializeApp({
            credential: cert(absolutePath),
        });
    } else {
        console.warn('Warning: No Firebase credentials found (Env vars or File path). Notification features may fail.');
        // Initialize with default credentials (Google Application Default Credentials) as a fallback
        return initializeApp();
    }
};

app = initializeFirebase();

export const firebaseApp = app;
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const messaging: Messaging = getMessaging(app);
