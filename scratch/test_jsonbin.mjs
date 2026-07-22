import fetch from 'node-fetch';

async function testJsonbin() {
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bin-Private': 'false'
      },
      body: JSON.stringify({ profiles: [{ name: "Test" }], inventory: [], history: [], categories: [] })
    });
    console.log("jsonbin status:", res.status);
    const data = await res.json();
    console.log("jsonbin bin ID:", data.metadata?.id);

    if (data.metadata?.id) {
      const binId = data.metadata.id;
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`);
      console.log("jsonbin get status:", getRes.status);
      const getData = await getRes.json();
      console.log("jsonbin get data:", getData.record);
    }
  } catch (e) {
    console.error("jsonbin error:", e);
  }
}

testJsonbin();
