import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB0VynQ_R9H4SCbRzZOwm0saElaKIBsrd8",
    authDomain: "event-planner-12850.firebaseapp.com",
    projectId: "event-planner-12850",
    storageBucket: "event-planner-12850.firebasestorage.app",
    messagingSenderId: "352711547042",
    appId: "1:352711547042:web:443b5528768ddd24949ffb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;