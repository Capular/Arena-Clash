import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyApNLIjHWRc1eawliewl6KByPOKUxdOVHM",
    authDomain: "arena-clash-99bc1.firebaseapp.com",
    projectId: "arena-clash-99bc1",
    storageBucket: "arena-clash-99bc1.firebasestorage.app",
    messagingSenderId: "724797078880",
    appId: "1:724797078880:web:14236610af3b6d4c07f205",
    measurementId: "G-QCJ60CLZ36"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
