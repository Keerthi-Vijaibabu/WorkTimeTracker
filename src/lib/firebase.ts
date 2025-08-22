import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "worktracker-jg53z",
  "appId": "1:92953291335:web:d0f3ed8cb78069c3539f62",
  "storageBucket": "worktracker-jg53z.firebasestorage.app",
  "apiKey": "AIzaSyD6cRb21KbhYb0Q7PXN6RXcJdBgoTAPINA",
  "authDomain": "worktracker-jg53z.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "92953291335"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);

export { app, auth };
