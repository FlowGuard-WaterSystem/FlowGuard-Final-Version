import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as FirebaseAuth from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Paste YOUR values from Firebase Console > Project settings > Your apps > Web app
const firebaseConfig = {
   apiKey: "AIzaSyD7Qn1W4boZtimvBPYzR3n0POr0xwVIuIE",
  authDomain: "flowguard-fc1c6.firebaseapp.com",
  projectId: "flowguard-fc1c6",
  storageBucket: "flowguard-fc1c6.firebasestorage.app",
  messagingSenderId: "1096834453811",
  appId: "1:1096834453811:web:88f18ce9d014de333dee46"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// getReactNativePersistence exists at runtime in React Native but is missing from
// the TypeScript types, so it is read through "any" to avoid the red error.
const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence;

let authInstance: FirebaseAuth.Auth;
try {
  authInstance = FirebaseAuth.initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialised (happens when the app hot-reloads)
  authInstance = FirebaseAuth.getAuth(app);
}
export const auth = authInstance;
