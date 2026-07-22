import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Testing Firestore real-time snapshot subscription...");

const docRef = doc(db, 'pantry', 'shared_pantry_data');

const unsub = onSnapshot(docRef, (snapshot) => {
  console.log("Snapshot received! Exists:", snapshot.exists(), "hasPendingWrites:", snapshot.metadata.hasPendingWrites);
  if (snapshot.exists()) {
    console.log("Data profiles count:", snapshot.data().profiles?.length);
    console.log("Data profiles:", snapshot.data().profiles?.map(p => p.name));
  }
}, (err) => {
  console.error("Snapshot error:", err);
});

setTimeout(async () => {
  console.log("Updating document in Firestore...");
  await setDoc(docRef, {
    testField: Date.now(),
    lastUpdated: new Date().toISOString(),
  }, { merge: true });
  console.log("Doc updated!");
}, 2000);

setTimeout(() => {
  unsub();
  console.log("Test finished!");
  process.exit(0);
}, 6000);
