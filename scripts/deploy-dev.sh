#!/bin/bash
# React Native Development Deployment Script
# Ensures fresh JavaScript deployment without rebuilding APK

echo ""
echo "===================================="
echo "  React Native Fresh Deployment"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Kill Metro bundler
echo -e "${YELLOW}[1/4] Killing Metro bundler...${NC}"
npx kill-port 8082 2>/dev/null
pkill -f "metro" 2>/dev/null
sleep 2

# Step 2: Start Metro with cache reset
echo -e "${YELLOW}[2/4] Starting Metro with cache reset...${NC}"
npm start -- --reset-cache &
METRO_PID=$!
sleep 5

# Step 3: Reload app
echo -e "${YELLOW}[3/4] Reloading app on device...${NC}"
adb shell input keyevent KEYCODE_R KEYCODE_R

# Step 4: Check deployment markers
echo -e "${YELLOW}[4/4] Checking deployment markers...${NC}"
echo ""
sleep 2
adb logcat -d -s ReactNativeJS | grep -E "DEPLOYMENT.*2025" || echo "No deployment markers found yet..."

echo ""
echo -e "${GREEN}===================================="
echo "  Deployment Complete!"
echo "====================================${NC}"
echo ""
echo "If you don't see deployment markers above:"
echo "1. Check that Metro shows 'Loading dependency graph, done'"
echo "2. Try pressing 'r' in the Metro terminal"
echo "3. Check device is connected: adb devices"
echo ""
echo "To view live logs: adb logcat -s ReactNativeJS"
echo "Metro PID: $METRO_PID (kill with: kill $METRO_PID)"
echo ""