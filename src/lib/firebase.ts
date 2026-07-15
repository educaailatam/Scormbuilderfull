/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0820929944",
  appId: "1:95576324198:web:e643fc9458fbba033e15a7",
  apiKey: "AIzaSyDB5aNStgB57lTqt2wE-URroavcoaGmGds",
  authDomain: "gen-lang-client-0820929944.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-scormquestbuilde-331425fc-b2d1-44fc-ae44-18e797e1825e",
  storageBucket: "gen-lang-client-0820929944.firebasestorage.app",
  messagingSenderId: "95576324198"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the custom databaseId from config
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };
