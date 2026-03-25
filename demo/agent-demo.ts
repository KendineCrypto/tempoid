/**
 * TempoID Agent Demo
 *
 * An AI agent that autonomously registers a .tempo domain via MPP.
 * Run: npx tsx demo/agent-demo.ts
 */

import { config } from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { Mppx, tempo } from "mppx/client";

// Load .env from demo folder
config({ path: new URL("./.env", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1") });

// --- Agent's wallet (funded with pathUSD on Tempo) ---
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}`;

if (!AGENT_PRIVATE_KEY) {
  console.error("❌ Set AGENT_PRIVATE_KEY environment variable");
  process.exit(1);
}

const account = privateKeyToAccount(AGENT_PRIVATE_KEY);
const shortAddr = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
console.log(`\n🤖 AI Agent initialized`);
console.log(`   Wallet: ${shortAddr}\n`);

// --- Initialize MPP client (auto-handles 402 challenges) ---
Mppx.create({
  methods: [tempo({ account })],
});

const API = process.env.API_URL || "https://tempoid.xyz";
const DOMAIN_NAME = process.argv[2] || "myagent";

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  TempoID — AI Agent Domain Registration");
  console.log("═══════════════════════════════════════════\n");

  // Step 1: Check availability
  console.log(`📡 Step 1: Checking if "${DOMAIN_NAME}.tempo" is available...`);
  const checkRes = await fetch(`${API}/api/mpp/check/${DOMAIN_NAME}`);
  const checkData = await checkRes.json();
  console.log(`   ✅ Available: ${checkData.available}`);
  console.log(`   💰 Price: ${checkData.price_per_year} pathUSD/year\n`);

  if (!checkData.available) {
    console.log(`❌ "${DOMAIN_NAME}.tempo" is already taken.`);

    // Try to resolve it
    console.log(`\n📡 Resolving current owner...`);
    const resolveRes = await fetch(`${API}/api/mpp/resolve/${DOMAIN_NAME}`);
    const resolveData = await resolveRes.json();
    console.log(`   Owner: ${resolveData.address}\n`);
    return;
  }

  // Step 2: Register via MPP (auto-handles 402 → payment → credential)
  console.log(`📡 Step 2: Registering "${DOMAIN_NAME}.tempo" via MPP...`);
  console.log(`   → Sending request to TempoID API`);
  console.log(`   → MPP will handle payment automatically\n`);

  const registerRes = await fetch(`${API}/api/mpp/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: DOMAIN_NAME,
      owner_address: account.address,
      duration_years: 1,
    }),
  });

  const registerData = await registerRes.json();

  if (registerData.success) {
    const shortOwner = `${registerData.owner.slice(0, 6)}...${registerData.owner.slice(-4)}`;
    const shortTx = `${registerData.tx_hash.slice(0, 10)}...${registerData.tx_hash.slice(-6)}`;
    console.log(`   ✅ Domain registered!`);
    console.log(`   📛 Name: ${registerData.name}`);
    console.log(`   👤 Owner: ${shortOwner}`);
    console.log(`   💰 Paid: ${registerData.price_paid}`);
    console.log(`   🔗 TX: ${shortTx}`);
    console.log(`   📦 Block: ${registerData.block}\n`);
  } else {
    console.log(`   ❌ Registration failed: ${registerData.error}\n`);
    return;
  }

  // Step 3: Verify by resolving the name
  console.log(`📡 Step 3: Verifying registration...`);
  const verifyRes = await fetch(`${API}/api/mpp/resolve/${DOMAIN_NAME}`);
  const verifyData = await verifyRes.json();
  const shortResolved = `${verifyData.address.slice(0, 6)}...${verifyData.address.slice(-4)}`;
  console.log(`   ✅ ${verifyData.name} → ${shortResolved}`);

  // Step 4: Reverse lookup
  console.log(`\n📡 Step 4: Reverse lookup...`);
  const reverseRes = await fetch(
    `${API}/api/mpp/reverse/${account.address}`
  );
  const reverseData = await reverseRes.json();
  const shortReverse = `${reverseData.address.slice(0, 6)}...${reverseData.address.slice(-4)}`;
  console.log(`   ✅ ${shortReverse} → ${reverseData.primary_name}`);

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  ✅ AI Agent now owns: ${DOMAIN_NAME}.tempo`);
  console.log(`═══════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
