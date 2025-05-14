#!/bin/bash

# Set the interval to 6 hours (in seconds)
INTERVAL=$((6 * 60 * 60))  # 21600 seconds

# List of PM2 script names to restart
scripts=(
  "babylon.js"
  "babylon2.js"
  "babylon3.js"
  "babylon4.js"
  "babylon5.js"
  "babylon6.js"
  "holesky.js"
  "holesky2.js"
  "holesky3.js"
  "holesky4.js"
  "holesky5.js"
  "holesky6.js"
)

# Infinite loop to restart processes every INTERVAL
while true; do
  echo "[$(date)] Restarting PM2 processes..." >> /var/log/pm2_restart.log

  for script in "${scripts[@]}"; do
    echo "Restarting $script..." >> /var/log/pm2_restart.log
    pm2 restart "$script"
  done

  echo "[$(date)] Restart complete. Sleeping for $INTERVAL seconds..." >> /var/log/pm2_restart.log
  sleep "$INTERVAL"
done
