// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDFvKw6HYnD8JVlDI36SdQ22VikCqj2Wj4",
    authDomain: "stockmatch-dev.firebaseapp.com",
    projectId: "stockmatch-dev",
    storageBucket: "stockmatch-dev.firebasestorage.app",
    messagingSenderId: "966686569154",
    appId: "1:966686569154:web:cfdc343bbc62acd37a015b"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
  
  // 使用者登入後寫入 profile
  export async function saveUserProfile(user: any) {
    const ref = doc(db, 'users', user.uid, 'profile');
    await setDoc(ref, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      joinedAt: new Date()
    }, { merge: true });
  }