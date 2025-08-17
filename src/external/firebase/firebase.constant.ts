import * as admin from 'firebase-admin';
export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IFirebaseApp extends admin.app.App {}
