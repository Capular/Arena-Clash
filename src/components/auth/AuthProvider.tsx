"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    userData: UserData | null;
}

interface UserData {
    role?: string;
    username?: string;
    favoriteGame?: string;
    hasCompletedOnboarding?: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false, userData: null });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserDoc: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // Unsubscribe from previous user doc if exists
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
                unsubscribeUserDoc = null;
            }

            if (currentUser) {
                setLoading(true);
                // Listen to user document changes in real-time
                unsubscribeUserDoc = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data() as UserData;
                        setUserData(data);
                        setIsAdmin(data.role === 'admin');
                    } else {
                        // Handle case where user exists in Auth but not Firestore (new user)
                        setUserData({ hasCompletedOnboarding: false });
                        setIsAdmin(false);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user data:", error);
                    setUserData(null);
                    setIsAdmin(false);
                    setLoading(false);
                });
            } else {
                setUserData(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) unsubscribeUserDoc();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, userData }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
