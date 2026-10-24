'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  User, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  signOut, updateProfile, sendPasswordResetEmail,
  setPersistence, browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Firebase auth codes → plain-English messages. Users never see a raw
// Firebase code or SDK message.
const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-email': "That email address doesn't look right — please check it.",
  'auth/user-not-found': 'No account found with this email. Try creating one.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Please choose a stronger password — at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts — please wait a moment and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact support if you think this is a mistake.',
  'auth/network-request-failed': 'Network trouble — check your connection and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window — allow popups and try again.',
  'auth/account-exists-with-different-credential':
    'This email is already linked to another sign-in method. Try signing in with email instead.',
  'auth/operation-not-allowed': "This sign-in method isn't enabled for the app yet.",
  'auth/unauthorized-domain': "This site isn't authorized for sign-in yet. Please contact the app owner.",
  'auth/invalid-api-key': "Sign-in isn't configured yet — the app is running without valid Firebase keys.",
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    "Sign-in isn't configured yet — the app is running without valid Firebase keys.",
  'auth/configuration-not-found': "Sign-in isn't set up for this project yet.",
  'auth/admin-restricted-operation': 'Creating new accounts is restricted right now.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
};

function authErrorToMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERRORS[error.code] || 'Something went wrong — please try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong — please try again.';
}

// Rethrow with a friendly message while keeping the original Firebase `code`
// on the error, so callers that map codes themselves (e.g. app/auth/page.tsx)
// keep working unchanged.
function friendly(error: unknown): Error {
  const e = new Error(authErrorToMessage(error));
  const code = (error as { code?: string }).code;
  if (code) (e as Error & { code?: string }).code = code;
  return e;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stay signed in across tabs and browser restarts. (Local is the SDK
    // default — made explicit here; if it can't be set, auth still works
    // with in-memory persistence for the session.)
    setPersistence(auth, browserLocalPersistence).catch(() => undefined);
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  const signInEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw friendly(e);
    }
  };

  const signUpEmail = async (email: string, password: string, name: string) => {
    let user: User;
    try {
      ({ user } = await createUserWithEmailAndPassword(auth, email, password));
    } catch (e) {
      throw friendly(e);
    }
    // displayName is cosmetic — the welcome onboarding asks for the business
    // name anyway. Never fail the whole signup over it.
    try {
      await updateProfile(user, { displayName: name });
    } catch {
      // ignore — account already created
    }
  };

  const signInGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      throw friendly(e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      throw friendly(e);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      throw friendly(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInEmail, signUpEmail, signInGoogle, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
