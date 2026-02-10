import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDxLS8lHGu9A5WElXIp0dVxRFv37cyeY0s",
  authDomain: "workconcept-app.firebaseapp.com",
  databaseURL: "https://workconcept-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "workconcept-app",
  storageBucket: "workconcept-app.firebasestorage.app",
  messagingSenderId: "282713659171",
  appId: "1:282713659171:web:294793fe9dd982ea959e96"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };