const routes = [
  "http://localhost:3000/",
  "http://localhost:3000/whatsapp-center",
  "http://localhost:3000/register",
  "http://localhost:3000/technician-queue",
  "http://localhost:3000/api/stents?stats=true",
  "http://localhost:3000/api/whatsapp/status"
];

async function testAll() {
  console.log("=========================================");
  console.log("🏥 VERIFYING ALL ROUTES & ENDPOINTS");
  console.log("=========================================");
  for (const url of routes) {
    try {
      const res = await fetch(url);
      console.log(`✅ [HTTP ${res.status}] ${url}`);
    } catch (e) {
      console.log(`❌ [FAILED] ${url}: ${e.message}`);
    }
  }
  console.log("=========================================\n");
}

testAll();
