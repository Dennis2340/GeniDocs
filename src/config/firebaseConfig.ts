// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyA6kmUmCEFFAp9RHy8sza1K-ayAvjPNQJg",
  authDomain: "xplain-ai-vectordb.firebaseapp.com",
  projectId: "xplain-ai-vectordb",
  storageBucket: "xplain-ai-vectordb.firebasestorage.app",
  messagingSenderId: "233510837124",
  appId: "1:233510837124:web:abe9a35194ef9b8672dbd1",
  measurementId: "G-HL0HBZTTTG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
