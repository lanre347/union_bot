**Note : This bot for pesonal use, you can make changes manually for your use**

```node sepolia_holesky.js```
Use case for transfer 0.01 USDC from Sepolia to Holesky 

```node sepolia_babylon.js```
Use case for transfer 0.01 USDC from Sepolia to Babylon. You need to save babylon address on wallets.json


```wallets.json``` to save your private key and address babylon.
for single wallet use this format
```{
  "wallets": [
    {
      "name": "Wallet1",
      "privatekey": "pk1",
      "babylonAddress": "bbn....."
    }
  ]
}```

for multiple wallet use this format
```{
  "wallets": [
    {
      "name": "Wallet1",
      "privatekey": "pk1",
      "babylonAddress": "bbn....."
    },
    {
      "name": "Wallet2",
      "privatekey": "pk2",
      "babylonAddress": "bbn....."
    },
	{
      "name": "Wallet2",
      "privatekey": "pk3",
      "babylonAddress": "bbn....."
    }
  ]
}```

```maxTransaction.txt```
Change this for increase or decrease of transaction.