
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from 'next/navigation';
import { isAdmin, createUserDocument } from "@/lib/data";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
  changePassword: (currentPass: string, newPass: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  changePassword: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (user?.uid) {
      // Ensure user document exists before checking admin status
      await createUserDocument(user.uid, user.email!);
      const adminStatus = await isAdmin(user.uid);
      setIsAdminUser(adminStatus);
    } else {
      setIsAdminUser(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      await checkAdminStatus(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    await checkAdminStatus(userCredential.user);
    return userCredential;
  };

  const signup = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    // Create a corresponding user document in Firestore
    await createUserDocument(userCredential.user.uid, userCredential.user.email!);
    // Re-check admin status after creation
    await checkAdminStatus(userCredential.user);
    return userCredential;
  };

  const logout = () => {
    setIsAdminUser(false);
    return signOut(auth);
  };
  
  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user || !user.email) {
      throw new Error("User not authenticated.");
    }
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
  }
  
  const value = {
    user,
    loading,
    isAdmin: isAdminUser,
    login,
    signup,
    logout,
    changePassword,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (!user && !isAuthPage) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user && isAuthPage) {
     return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
