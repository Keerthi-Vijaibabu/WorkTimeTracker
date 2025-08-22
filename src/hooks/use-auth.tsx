
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
import { isAdmin as checkIsAdmin, createUserDocument } from "@/lib/data";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await createUserDocument(user.uid, user.email!);
        const adminStatus = await checkIsAdmin(user.uid);
        setIsAdminUser(adminStatus);
      } else {
        setUser(null);
        setIsAdminUser(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
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
    return <div className="flex items-center justify-center h-screen w-full">Loading...</div>;
  }
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (!user && !isAuthPage) {
    router.push('/login');
    // Show loading while redirecting
    return <div className="flex items-center justify-center h-screen w-full">Loading...</div>;
  }
  
  if(user && isAuthPage) {
      router.push('/');
      return <div className="flex items-center justify-center h-screen w-full">Loading...</div>;
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
