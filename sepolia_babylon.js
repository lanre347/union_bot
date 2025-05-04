const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const walletData = require("./wallet.json");
const axios = require("axios");
const chains = require('./chains');
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
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
  }

  return true;
}

async function main() {
  const walletData = JSON.parse(fs.readFileSync(path.join(__dirname, "wallet.json"), "utf8"));
  const wallets = walletData.wallets;
  header();

  for (const w of wallets) {
    const { privatekey, name, babylonAddress } = w;
    if (!babylonAddress || !privatekey) {
      console.warn(`⚠️ Skip ${name || "wallet with missing data"}.`);
      continue;
    }

    try {
      const wallet = new ethers.Wallet(privatekey, provider);
      const sender = wallet.address;
      const senderHex = sender.slice(2);
	  console.log(`🚀 Sending ${maxTransaction} Transaction Sepolia to Babylon from ${wallet.address} (${name})`);
      const shouldProceed = await checkBalanceAndApprove(wallet, USDC_ADDRESS, contractAddress);
      if (!shouldProceed) continue;

      const contract = new ethers.Contract(contractAddress, UCS03_ABI, wallet);
      const recipient = babylonAddress;
      const recipientHex = Buffer.from(recipient, "utf8").toString("hex");
      const channelId = 7;
      const timeoutHeight = 0;

      const instruction = {
        version: 0,
        opcode: 2,
        operand: `0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000014${senderHex}000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a${recipientHex}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000141c7d4b196cb0c7b01d743fbc6116a902379c72380000000000000000000000000000000000000000000000000000000000000000000000000000000000000004555344430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045553444300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e62626e317a7372763233616b6b6778646e77756c3732736674677632786a74356b68736e743377776a687030666668363833687a7035617135613068366e0000`
      };

      for (let i = 1; i <= maxTransaction; i++) {
        console.log(`🚀 ${name} | Transaction ${i}/${maxTransaction}`);
        const timestampNow = Math.floor(Date.now() / 1000);
        const salt = ethers.keccak256(
          ethers.solidityPacked(["address", "uint256"], [wallet.address, timestampNow])
        );
        const now = BigInt(Date.now()) * 1_000_000n;
        const oneDayNs = 86_400_000_000_000n;
        const timeoutTimestamp = (now + oneDayNs).toString();

        const tx = await contract.send(channelId, timeoutHeight, timeoutTimestamp, salt, instruction);
        await tx.wait(1);

        console.log(`${timelog()} | ✅ ${name} | Transaction ${i}: ${explorer.tx(tx.hash)}`);
        await delay(3000);
      }
	  console.log('');
    } catch (err) {
      console.error(`${timelog()} | ❌ ${name} | Error:`, err.message);
    }
  }
}

main().catch(console.error);
