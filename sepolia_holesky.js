const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const walletData = require("./wallet.json");
const axios = require("axios")
const chains = require('./chains');
const { UCS03_ABI, USDC_ABI } = require("./abi/abi");
const provider = chains.testnet.sepolia.provider();
const explorer = chains.testnet.sepolia.explorer;
const moment = require('moment-timezone');
const header = chains.utils.etc.header;
const delay = chains.utils.etc.delay;
const unionExplorer = chains.utils.etc.union;
const timelog = chains.utils.etc.timelog;

const contractAddress = "0x5FbE74A283f7954f10AA04C2eDf55578811aeb03";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const maxTransaction = parseInt(fs.readFileSync(path.join(__dirname, 'maxTransaction.txt'), 'utf8').trim());

async function checkBalanceAndApprove(wallet, usdcAddress, spenderAddress) {
  const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, wallet);
  
  const balance = await usdcContract.balanceOf(wallet.address);
  if (balance === 0n) {
    console.log(`🛑 ${wallet.address} has 0 USDC. Please claim faucet first at https://faucet.circle.com`);
    return false;
  }

  const allowance = await usdcContract.allowance(wallet.address, spenderAddress);
  if (allowance === 0n) {
    console.log(`✍️ USDC is not allowance. Sending approve transaction....`);

    const approveAmount = ethers.MaxUint256;
    try {
      const tx = await usdcContract.approve(spenderAddress, approveAmount);
      const receipt = await tx.wait();
      console.log(`✅ Approve confirmed: ${explorer.tx(receipt.hash)}`);
	  await delay(3000);
    } catch (err) {
      console.error(`❌ Approve failed:`, err.message);
      return false;
    }
  } else {
  }

  return true;
}


async function sendFromWallet(walletInfo) {
  const wallet = new ethers.Wallet(walletInfo.privatekey, provider);
  const shouldProceed = await checkBalanceAndApprove(wallet, USDC_ADDRESS, contractAddress);
	if (!shouldProceed) return;
  const contract = new ethers.Contract(contractAddress, UCS03_ABI, wallet);
  const addressHex = wallet.address.slice(2);
  const channelId = 8;
  const timeoutHeight = 0;
  const now = BigInt(Date.now()) * 1_000_000n;
  const oneDayNs = 86_400_000_000_000n;
  const timeoutTimestamp = (now + oneDayNs).toString();
  const timestampNow = Math.floor(Date.now() / 1000);
  const salt = ethers.keccak256(
    ethers.solidityPacked(["address", "uint256"], [wallet.address, timestampNow])
  );

  const operand = "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000014" + addressHex + "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000014" + addressHex + "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000141c7d4b196cb0c7b01d743fbc6116a902379c72380000000000000000000000000000000000000000000000000000000000000000000000000000000000000004555344430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045553444300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001457978bfe465ad9b1c0bf80f6c1539d300705ea50000000000000000000000000";
  const instruction = {
    version: 0,
    opcode: 2,
    operand
  };

  try {
      const tx = await contract.send(channelId, timeoutHeight, timeoutTimestamp, salt, instruction);
      await tx.wait(1);
	  console.log(`${timelog()} | ✅ ${walletInfo.name} | Transaction Confirmed: ${explorer.tx(tx.hash)}`);
	  console.log('');
  } catch (err) {
    console.error(`❌ Failed for ${wallet.address}:`, err.message, "\n");
  }
}

async function main() {
  header();
  for (const walletInfo of walletData.wallets) {
    if (!walletInfo.privatekey || !walletInfo.privatekey.startsWith("0x")) {
      console.log(`⚠️ Skipping invalid wallet: ${walletInfo.name}`);
      continue;
    }
	const wallet = new ethers.Wallet(walletInfo.privatekey, provider);
	console.log(`🚀 Sending ${maxTransaction} Transaction Sepolia to Holesky from ${wallet.address} (${walletInfo.name})`);
    for (let i = 1; i <= maxTransaction; i++) {
      console.log(`🔁 ${walletInfo.name} | Transaction ${i}/${maxTransaction}`);
      await sendFromWallet(walletInfo);
      await delay(1000); // opsional delay antar transaksi
    }
  }
}

main();
