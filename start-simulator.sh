#!/bin/bash

echo "🚀 Starting Magic Board Training Mobile App..."
echo ""

# Clear Expo cache if it exists
if [ -d ".expo" ]; then
  echo "Clearing Expo cache..."
  rm -rf .expo
fi

# Make sure iPhone 17 Pro is booted
echo "Ensuring simulator is ready..."
SIMULATOR_UDID=$(xcrun simctl list devices available | grep "iPhone 17 Pro" | head -1 | grep -o '[A-F0-9-]\{36\}')

if [ -z "$SIMULATOR_UDID" ]; then
  echo "❌ No iPhone 17 Pro simulator found"
  echo "Please open Xcode and create an iPhone simulator"
  exit 1
fi

echo "Using simulator: $SIMULATOR_UDID"

# Boot the simulator if not already booted
xcrun simctl boot "$SIMULATOR_UDID" 2>/dev/null || echo "Simulator already booted"

# Open Simulator app
open -a Simulator

# Wait a moment for simulator to be ready
sleep 2

# Start Expo with clear cache
echo ""
echo "Starting Expo..."
npx expo start --clear --ios

echo ""
echo "✅ App should now be running in the simulator!"
