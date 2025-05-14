#!/bin/bash

while true
do
    echo "Starting bot at $(date)"

    # Use expect to handle the interactive prompts
    expect <<EOF &
spawn node union.js

# Handle the "Choose wallets to use:" prompt
expect "Choose wallets to use:" { exp_continue }

# Handle the wallet number input
expect "Enter wallet numbers*" { send "1\r" }

# Wait for the transaction count prompt
expect "Enter number of transactions (default 1 if empty or 0):" { send "700\r" }

# Handle the transaction type prompt
expect "Enter number of transaction type (e.g., 1 or 0 for all):" { send "2\r" }

# Allow time for the process to run
expect eof
EOF

    echo "Bot running for 5 hour..."
    sleep 18000

    # Kill the bot after 5 hours
    echo "Stopping bot at $(date)..."
    pkill -f "node union.js"

    echo "Waiting 5 hour before restarting..."
    sleep 18000
done

