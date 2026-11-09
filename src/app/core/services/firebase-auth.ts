import { Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyCLaoWP3ULeNZ5-n2mALbHEJAXi8letlYY',
  authDomain: 'pet-health-e4ee8.firebaseapp.com',
  projectId: 'pet-health-e4ee8',
  storageBucket: 'pet-health-e4ee8.firebasestorage.app',
  messagingSenderId: '821180977695',
  appId: '1:821180977695:web:f968a5357915b132c33b2a',
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

@Injectable({ providedIn: 'root' })
export class FirebaseAuth {
  private readonly auth = getAuth(firebaseApp);
  private readonly googleProvider = new GoogleAuthProvider();

  signInWithGoogle(): Promise<UserCredential> {
    return signInWithPopup(this.auth, this.googleProvider);
  }

  async getIdToken(): Promise<string | null> {
    await this.auth.authStateReady();
    return this.auth.currentUser?.getIdToken() ?? null;
  }
}

export function getFirebaseAuthErrorKey(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'auth.googleSignInError';
  }

  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'auth.googleSignInCancelled';
    case 'auth/unauthorized-domain':
      return 'auth.googleDomainNotAuthorized';
    case 'auth/operation-not-allowed':
      return 'auth.googleProviderNotEnabled';
    case 'auth/popup-blocked':
      return 'auth.googlePopupBlocked';
    default:
      return 'auth.googleSignInError';
  }
}
