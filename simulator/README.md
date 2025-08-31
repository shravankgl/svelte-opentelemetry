# Setup & Usage
1. Install dependencies:
```
npm init -y
npm install playwright commander
npx playwright install chromium
```
2. Make webvitals-simulator.js executable:
```
bashchmod +x webvitals-simulator.js
```
3. Usage examples:
```
# Basic 5-minute simulation
node webvitals-simulator.js

# 2-hour simulation with 3 concurrent sessions
node webvitals-simulator.js --duration 120 --concurrent 3

# Run with browser UI visible for debugging
node webvitals-simulator.js --headed --duration 2

# Custom URL and timing
node webvitals-simulator.js --url http://localhost:3000 --duration 30 --min-wait 1000 --max-wait 5000
```