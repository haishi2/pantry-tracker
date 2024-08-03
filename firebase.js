// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const config = require("./util/config");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: config.API_KEY,
  authDomain: "pantry-tracker-3bc24.firebaseapp.com",
  projectId: "pantry-tracker-3bc24",
  storageBucket: "pantry-tracker-3bc24.appspot.com",
  messagingSenderId: "877680524591",
  appId: "1:877680524591:web:80defd3d55c65778c2b5da",
  measurementId: "G-XTMPZ6ZLWT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const fireStore = getFirestore(app);
const storage = getStorage(app);

export { fireStore, storage };
