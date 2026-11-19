import { getApp, getApps, initializeApp } from "firebase/app";
import { get, getDatabase, onValue, ref, set } from "firebase/database";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    process.env.VITE_FIREBASE_API_KEY ??
    "AIzaSyA7234LMF8gqwiT0AY8onQ5YnThecKiZgM",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    process.env.VITE_FIREBASE_AUTH_DOMAIN ??
    "jsr-bg.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    process.env.VITE_FIREBASE_DATABASE_URL ??
    "https://jsr-bg.asia-southeast1.firebasedatabase.app",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.VITE_FIREBASE_PROJECT_ID ??
    "jsr-bg",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    process.env.VITE_FIREBASE_STORAGE_BUCKET ??
    "jsr-bg.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
    "814395234214",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    process.env.VITE_FIREBASE_APP_ID ??
    "1:814395234214:web:b5bc7fa0657784202a2167",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? process.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-B3GKE4L38B",
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export const firebaseApp = firebaseEnabled ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const database = firebaseApp ? getDatabase(firebaseApp) : null;

export async function readFirestoreDocument<T>(collection: string, id: string): Promise<T | null> {
  if (!db) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(db, collection, id));
    return snapshot.exists() ? ((snapshot.data() as T) ?? null) : null;
  } catch {
    return null;
  }
}

export async function writeFirestoreDocument<T extends object>(collection: string, id: string, value: T) {
  if (!db) {
    return;
  }

  try {
    await setDoc(doc(db, collection, id), value as Record<string, unknown>, { merge: true });
  } catch {
    // ignore Firebase write failures and fall back to local persistence
  }
}

export async function readRealtimeDocument<T>(path: string): Promise<T | null> {
  if (!database) {
    return null;
  }

  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? ((snapshot.val() as T) ?? null) : null;
  } catch {
    return null;
  }
}

export async function writeRealtimeDocument<T>(path: string, value: T) {
  if (!database) {
    return;
  }

  try {
    await set(ref(database, path), value);
  } catch {
    // ignore Firebase write failures and fall back to local persistence
  }
}

export function subscribeRealtimeDocument<T>(path: string, callback: (value: T | null) => void) {
  if (!database) {
    callback(null);
    return () => {};
  }

  const dbRef = ref(database, path);
  const unsubscribe = onValue(
    dbRef,
    (snapshot) => {
      callback(snapshot.exists() ? ((snapshot.val() as T) ?? null) : null);
    },
    () => {
      callback(null);
    },
  );

  return unsubscribe;
}
