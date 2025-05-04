const UCS03_ABI = [
  {
    "inputs": [
      { "internalType": "uint32", "name": "channelId", "type": "uint32" },
      { "internalType": "uint64", "name": "timeoutHeight", "type": "uint64" },
      { "internalType": "uint64", "name": "timeoutTimestamp", "type": "uint64" },
      { "internalType": "bytes32", "name": "salt", "type": "bytes32" },
      {
        "components": [
          { "internalType": "uint8", "name": "version", "type": "uint8" },
          { "internalType": "uint8", "name": "opcode", "type": "uint8" },
          { "internalType": "bytes", "name": "operand", "type": "bytes" }
        ],
        "internalType": "struct Instruction",
        "name": "instruction",
        "type": "tuple"
      }
    ],
    "name": "send",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const USDC_ABI = [
  // balanceOf
  {
    "constant": true,
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function",
    "stateMutability": "view"
  },
  // allowance
  {
    "constant": true,
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function",
    "stateMutability": "view"
  },
  // approve
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function",
    "stateMutability": "nonpayable"
  }
];
module.exports = { UCS03_ABI, USDC_ABI };