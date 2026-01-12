import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBDnSE2ljCZix6Cc38IxtlARtpbNdqt3nw',
  authDomain: 'evaluate-interview-22cb0.firebaseapp.com',
  projectId: 'evaluate-interview-22cb0',
  storageBucket: 'evaluate-interview-22cb0.firebasestorage.app',
  messagingSenderId: '902647381396',
  appId: '1:902647381396:web:74ad601cfc32f2b81ca381',
  databaseURL: 'https://evaluate-interview-22cb0-default-rtdb.firebaseio.com',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
