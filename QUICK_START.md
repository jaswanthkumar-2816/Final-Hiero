# 🚀 Quick Commands - Start Here!

## 🎯 Start All Servers (Run This!)

Open a terminal and run:

```bash
# Make script executable
chmod +x "/Users/jaswanthkumar/Desktop/shared folder/start-all-servers.sh"

# Start all servers
"/Users/jaswanthkumar/Desktop/shared folder/start-all-servers.sh"
```

## ✅ Verify Servers Are Running

```bash
lsof -i :2816 -i :3000 -i :8082 | grep LISTEN
```

Expected output: 3 node processes listening on ports 2816, 3000, and 8082

## 🛑 Stop All Servers

```bash
chmod +x "/Users/jaswanthkumar/Desktop/shared folder/stop-all-servers.sh"
"/Users/jaswanthkumar/Desktop/shared folder/stop-all-servers.sh"
```

## 📱 Test on Phone

After starting all servers:
```
https://85692af7a6b1.ngrok-free.app/signup.html
```

## 🐛 If Something Goes Wrong

### Frontend (8082) not running?
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"
node frontend-server.js
```

### Auth (3000) not running?
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/login system"
node main.js
```

### Gateway (2816) not running?
```bash
cd "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last"
PUBLIC_BASE_URL=https://85692af7a6b1.ngrok-free.app node gateway.js
```

## 📊 Check Logs

```bash
# Frontend log
tail -f "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last/frontend.log"

# Auth log
tail -f "/Users/jaswanthkumar/Desktop/shared folder/login system/auth.log"

# Gateway log
tail -f "/Users/jaswanthkumar/Desktop/shared folder/hiero last prtotype/jss/hiero/hiero last/gateway.log"
```

## ✨ That's It!

Run the start script, verify all 3 servers are running, then test on your phone!
