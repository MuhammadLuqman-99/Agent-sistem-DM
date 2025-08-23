// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBto4R2akCNCD8-vT7U039QhSOACUnnwIs",
    authDomain: "admin-agent-teamsale.firebaseapp.com",
    projectId: "admin-agent-teamsale",
    storageBucket: "admin-agent-teamsale.firebasestorage.app",
    messagingSenderId: "96870198845",
    appId: "1:96870198845:web:865ce29c0d78ce6e254454",
    measurementId: "G-E9EV0W1HXQ"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;