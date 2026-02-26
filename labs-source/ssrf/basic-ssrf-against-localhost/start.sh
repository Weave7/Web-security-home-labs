#!/bin/bash

echo "[*] Setting up internal DNS records..."
echo "127.0.0.1 api.corpconnect.internal" >> /etc/hosts

echo "[*] Starting the internal Rewards API (Port 5001)..."
python api_server.py &

sleep 2

echo "[*] Starting the main vulnerable web app (Port 5000)..."
python app.py