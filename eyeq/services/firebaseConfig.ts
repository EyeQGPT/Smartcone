// client/smartcone/firebaseConfig.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABXxuNFuM1YUmgNVAMEsrQJ8eQbZmmH3o",
  authDomain: "smartconegpt-dd0ec.firebaseapp.com",
  projectId: "smartconegpt-dd0ec",
  storageBucket: "smartconegpt-dd0ec.firebasestorage.app",
  messagingSenderId: "917556222954",
  appId: "1:917556222954:web:d1f06b7491615d1a3c3093",
  measurementId: "G-R8NX316V9K"
};

const app = (getApps().length === 0) ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app);

export { db };