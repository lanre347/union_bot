const chains = require('./chains');
const { ethers } = require("ethers");
const service = require('./service');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const etc = chains.utils.etc;


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function selectWallets(wallets) {
  console.log("Choose wallets to use:");
  console.log(`[0] All wallets`);
  wallets.forEach((w, idx) => {
    console.log(`[${idx + 1}] ${w.name}`);
  });

  let input = await askQuestion("Enter wallet numbers (comma-separated, e.g., 1,2 or 0 for all): ");
  let indexes = input
    .split(",")
    .map(i => parseInt(i.trim()))
    .filter(i => !isNaN(i) && i >= 0 && i <= wallets.length);

  if (indexes.length === 0) {
    console.log("Invalid input. Using first wallet.");
    return [wallets[0]];
  }

  let selected = indexes.includes(0) ? wallets : indexes.map(i => wallets[i - 1]);
  const validWallets = [];
  for (const w of selected) {
    try {
      new ethers.Wallet(w.privatekey);
      validWallets.push(w);
    } catch (err) {
      console.error(`[${etc.timelog()}] Wallet "${w.name}" has invalid private key. Skipping.`);
    }
  }

  if (validWallets.length === 0) {
    console.error(`[${etc.timelog()}] No valid wallets found. Exiting.`);
    process.exit(1);
  }

  return validWallets;
}

async function askMaxTransaction() {
  let input = await askQuestion('Enter number of transactions (default 1 if empty or 0): ');
  let value = parseInt(input);
  return isNaN(value) || value <= 0 ? 1 : value;
}

async function selectTransactionType() {
  const types = {
    1: { label: "Sepolia → Babylon", method: service.sepoliaBabylon },
    2: { label: "Sepolia → Holesky", method: service.sepoliaHolesky },
    0: { label: "All", method: null }
  };

  console.log("Choose transaction type:");
  Object.entries(types).forEach(([key, val]) => {
    console.log(`[${key}] ${val.label}`);
  });

  let input = await askQuestion("Enter number of transaction type (e.g., 1 or 0 for all): ");
  const choice = parseInt(input);
  if (isNaN(choice) || !types[choice]) {
    console.log("Invalid input. Using default (Holesky → Babylon).");
    return [types[1]];
  }

  return choice === 0 ? Object.values(types).filter(t => t.method !== null) : [types[choice]];
}

async function runTransactionParallel() {
  etc.header();

  const walletData = JSON.parse(fs.readFileSync(path.join(__dirname, "./wallet.json"), "utf8"));
  const wallets = walletData.wallets;

  const selectedWallets = await selectWallets(wallets);
  global.selectedWallets = selectedWallets;

  const maxTransaction = await askMaxTransaction();
  global.maxTransaction = maxTransaction;

  const transactionTypes = await selectTransactionType();

  rl.close();

  for (const tx of transactionTypes) {
    console.log(`[${etc.timelog()}] Executing transaction: ${tx.label}`);
    try {
      await tx.method();
    } catch (error) {
      console.error(`[${etc.timelog()}] Error in ${tx.label}: ${error.message}`);
    }
  }
}

runTransactionParallel();
