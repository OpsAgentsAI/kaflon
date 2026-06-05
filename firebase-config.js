const firebaseConfig = {
  apiKey: "AIzaSyDgHI69rZPf4q4IIOZkmjL4mgtl0iBRGHQ",
  authDomain: "opsagent-prod.firebaseapp.com",
  projectId: "opsagent-prod",
  storageBucket: "opsagent-prod.firebasestorage.app",
  messagingSenderId: "523955774086",
  appId: "1:523955774086:web:07427c38b6f9468027e707"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const functions = firebase.functions();
