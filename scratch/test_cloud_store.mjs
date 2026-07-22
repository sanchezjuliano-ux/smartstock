import fetch from 'node-fetch';

async function testFirebaseREST() {
  try {
    const url = 'https://gen-lang-client-0100523234-default-rtdb.firebaseio.com/pantry.json';
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: "hello smartstock", time: Date.now() })
    });
    console.log("Firebase RTDB status:", res.status);
    const text = await res.text();
    console.log("Firebase RTDB response:", text);
  } catch (e) {
    console.error("Firebase RTDB error:", e);
  }
}

async function testKvdb() {
  try {
    const bucketId = 'smartstock_sync_' + Math.random().toString(36).substring(2, 8);
    const url = `https://kvdb.io/${bucketId}/shared_data`;
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ test: "hello kvdb" })
    });
    console.log("kvdb status:", res.status);
    const text = await res.text();
    console.log("kvdb response:", text);
  } catch (e) {
    console.error("kvdb error:", e);
  }
}

testFirebaseREST();
testKvdb();
